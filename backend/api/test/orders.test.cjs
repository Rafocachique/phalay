const { test } = require('node:test');
const assert = require('node:assert/strict');
const { OrdersService } = require('../dist/modules/orders/orders.service');
const { PaymentsController } = require('../dist/modules/payments/payments.controller');

const productId = '11111111-1111-4111-8111-111111111111';
const product = { id: productId, name: 'Vestido', status: 'ACTIVE', price: 20,
  variants: [{ id: 'variant', price: 20, stock: 1 }], images: [] };
const body = { email: 'cliente@example.com', name: 'Cliente Uno', dni: '12345678',
  phone: '999999999', address: 'Calle Uno', paymentMethod: 'transferencia',
  missingDestinationName: 'Lima', checkoutIdempotencyKey: '22222222-2222-4222-8222-222222222222',
  items: [{ productId, variantId: 'variant', quantity: 1 }] };
const authenticatedCustomer = { id: 'user', email: body.email };

function fixture() {
  let stock = 1, result, storedOrder, paymentsCreated = 0;
  const tx = {
    product: { findUnique: async () => product },
    productVariant: { updateMany: async ({ where, data }) => {
      assert.equal(where.isActive, true);
      if (stock < where.stock.gte) return { count: 0 };
      stock -= data.stock.decrement;
      return { count: 1 };
    } },
    order: { create: async ({ data, include }) => {
      assert.equal(include.customer, undefined);
      result = { ...data, id: 'order', items: data.items.create };
      storedOrder = result;
      return result;
    } },
    payment: { create: async () => ({ id: `payment-${++paymentsCreated}` }) },
    missingDestinationRequest: { create: async () => ({}) },
  };
  const db = {
    systemSettings: { findFirst: async () => ({ paymentManualEnabled: true }) },
    user: { findUnique: async () => ({ id: 'user', firstName: 'Cliente', lastName: 'Uno', dni: body.dni, phone: body.phone, emailVerified: true }) },
    shippingAddress: {
      findFirst: async () => null,
      updateMany: async () => ({ count: 0 }),
      create: async () => ({ id: 'address' }),
    },
    $transaction: async (fn) => fn(tx),
    order: {
      findUnique: async ({ where }) =>
        storedOrder?.checkoutIdempotencyKey === where.checkoutIdempotencyKey ? storedOrder : null,
      findUniqueOrThrow: async () => result,
    },
  };
  return { service: new OrdersService(db, {}), db, tx, stock: () => stock, paymentsCreated: () => paymentsCreated };
}

test('rechaza cantidades inválidas antes de crear usuarios o direcciones', async () => {
  for (const quantity of [-1, 0, 1.5, '2', NaN, Infinity]) {
    const { service, db } = fixture();
    db.user.findUnique = () => { throw new Error('No debe escribir ni buscar al cliente'); };
    await assert.rejects(service.create({ ...body, items: [{ ...body.items[0], quantity }] }, authenticatedCustomer), /entero positivo/);
  }
});

test('rechaza carritos vacíos', async () => {
  await assert.rejects(fixture().service.create({ ...body, items: [] }, authenticatedCustomer), /carrito/);
});

test('dos compras de la última unidad: solo una puede reservar stock', async () => {
  const f = fixture();
  const outcomes = await Promise.allSettled([
    f.service.create(body, authenticatedCustomer),
    f.service.create({ ...body, checkoutIdempotencyKey: '33333333-3333-4333-8333-333333333333' }, authenticatedCustomer),
  ]);
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(f.stock(), 0);
});

test('un reintento con la misma llave devuelve el pedido existente sin duplicar pago', async () => {
  const f = fixture();
  const first = await f.service.create(body, authenticatedCustomer);
  const second = await f.service.create(body, authenticatedCustomer);
  assert.equal(first.order.id, second.order.id);
  assert.equal(f.paymentsCreated(), 1);
});

test('checkout no devuelve relaciones ni datos internos del cliente', async () => {
  const response = await fixture().service.create(body, authenticatedCustomer);
  assert.deepEqual(Object.keys(response.order).sort(), ['id','items','orderNumber','paymentStatus','status','total'].sort());
  assert.deepEqual(response.paymentDetails, { payment: { id: 'payment-1' } });
});

test('checkout rechaza un pedido cuyo correo no pertenece a la sesión', async () => {
  await assert.rejects(
    fixture().service.create({ ...body, email: 'otra-persona@example.com' }, authenticatedCustomer),
    /debe coincidir con tu sesión/,
  );
});

test('cotización rechaza productos retirados y cantidades negativas', async () => {
  const f = fixture();
  f.db.product = { findUnique: async () => product };
  await assert.rejects(f.service.calculateTotals([{ ...body.items[0], quantity: -1 }]), /entero positivo/);
  f.db.product.findUnique = async () => ({ ...product, status: 'DRAFT' });
  await assert.rejects(f.service.calculateTotals(body.items), /disponible/);
});

test('la cotización ignora cualquier precio o total manipulado por el navegador', async () => {
  const f = fixture();
  f.db.product = { findUnique: async () => product };
  const totals = await f.service.calculateTotals([{
    ...body.items[0],
    price: 0.01,
    unitPrice: 0.01,
    total: 0.01,
    subtotal: 0.01,
  }]);
  assert.deepEqual(totals, { subtotal: 20, shippingCost: 0, total: 20 });
});

test('webhook repetido confirma una sola vez y verifica importe y moneda', async () => {
  let completed = false, timelines = 0;
  const remote = { state: 'paid', amount: 2000, currency_code: 'PEN' };
  const tx = {
    payment: { findFirst: async () => ({ id: 'payment', orderId: 'order', amount: 20, currency: 'PEN' }),
      updateMany: async () => { if (completed) return { count: 0 }; completed = true; return { count: 1 }; } },
    order: { update: async () => ({}), updateMany: async () => ({ count: 1 }) },
    orderTimeline: { create: async () => { timelines++; } },
  };
  const service = new OrdersService({ $transaction: async fn => fn(tx) }, { getOrder: async () => remote });
  await Promise.all([service.reconcileCulqiOrder('ord_test_x'), service.reconcileCulqiOrder('ord_test_x')]);
  assert.equal(timelines, 1);
  remote.amount = 1;
  await assert.rejects(service.reconcileCulqiOrder('ord_test_x'), /importe/);
  remote.amount = 2000; remote.currency_code = 'USD';
  await assert.rejects(service.reconcileCulqiOrder('ord_test_x'), /moneda/);
});

test('webhook autentica el secreto y admite data como JSON string', async () => {
  let calls = 0;
  const controller = new PaymentsController({}, { reconcileCulqiOrder: async id => {
    assert.equal(id, 'ord_test_x'); calls++;
  } }, {}, { get: () => 'secret' });
  const request = { body: { object: 'event', type: 'order.status.changed', data: JSON.stringify({ id: 'ord_test_x' }) } };
  await assert.rejects(controller.culqiWebhook(request, 'wrong'), /inválida/);
  await controller.culqiWebhook(request, 'secret');
  assert.equal(calls, 1);
});

test('la revisión manual no permite aprobar pagos de Culqi ni valores no booleanos', async () => {
  const order = { id: 'order', paymentStatus: 'PENDING', status: 'PENDING', orderNumber: 'PH-1', total: 20 };
  const tx = { payment: { findFirst: async () => null } };
  const service = new OrdersService({
    order: { findUnique: async () => order },
    $transaction: async fn => fn(tx),
  }, {});
  await assert.rejects(service.reviewManualPayment('order', 'true', 'staff'), /decisión/);
  await assert.rejects(service.reviewManualPayment('order', true, 'staff'), /no usa pago manual/);
});
