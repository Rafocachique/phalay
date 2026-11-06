const { test } = require('node:test');
const assert = require('node:assert/strict');
const { OrdersService } = require('../dist/modules/orders/orders.service');
const { PaymentsController } = require('../dist/modules/payments/payments.controller');

const productId = '11111111-1111-4111-8111-111111111111';
const product = { id: productId, name: 'Vestido', status: 'ACTIVE', price: 20,
  variants: [{ id: 'variant', price: 20, stock: 1 }], images: [] };
const body = { email: 'cliente@example.com', name: 'Cliente Uno', dni: '12345678',
  phone: '999999999', address: 'Calle Uno', paymentMethod: 'transferencia',
  missingDestinationName: 'Lima', items: [{ productId, variantId: 'variant', quantity: 1 }] };

function fixture() {
  let stock = 1, result;
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
      return result;
    } },
    payment: { create: async () => ({ id: 'payment' }) },
    missingDestinationRequest: { create: async () => ({}) },
  };
  const db = {
    systemSettings: { findFirst: async () => ({ paymentManualEnabled: true }) },
    user: { findUnique: async () => ({ id: 'user', firstName: 'Cliente', lastName: 'Uno', dni: body.dni, phone: body.phone }) },
    shippingAddress: { create: async () => ({ id: 'address' }) },
    $transaction: async (fn) => fn(tx),
    order: { findUniqueOrThrow: async () => result },
  };
  return { service: new OrdersService(db, {}), db, tx, stock: () => stock };
}

test('rechaza cantidades inválidas antes de crear usuarios o direcciones', async () => {
  for (const quantity of [-1, 0, 1.5, '2', NaN, Infinity]) {
    const { service, db } = fixture();
    db.user.findUnique = () => { throw new Error('No debe escribir ni buscar al cliente'); };
    await assert.rejects(service.create({ ...body, items: [{ ...body.items[0], quantity }] }), /entero positivo/);
  }
});

test('rechaza carritos vacíos', async () => {
  await assert.rejects(fixture().service.create({ ...body, items: [] }), /carrito/);
});

test('dos compras de la última unidad: solo una puede reservar stock', async () => {
  const f = fixture();
  const outcomes = await Promise.allSettled([f.service.create(body), f.service.create(body)]);
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(f.stock(), 0);
});

test('checkout no devuelve relaciones ni datos internos del cliente', async () => {
  const response = await fixture().service.create(body);
  assert.deepEqual(Object.keys(response.order).sort(), ['id','items','orderNumber','paymentStatus','status','total'].sort());
  assert.deepEqual(response.paymentDetails, { payment: { id: 'payment' } });
});

test('cotización rechaza productos retirados y cantidades negativas', async () => {
  const f = fixture();
  f.db.product = { findUnique: async () => product };
  await assert.rejects(f.service.calculateTotals([{ ...body.items[0], quantity: -1 }]), /entero positivo/);
  f.db.product.findUnique = async () => ({ ...product, status: 'DRAFT' });
  await assert.rejects(f.service.calculateTotals(body.items), /disponible/);
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
