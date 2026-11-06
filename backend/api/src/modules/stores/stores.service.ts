import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateSettings() {
    let settings = await this.prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          storeName: 'Mi Tienda',
        }
      });
    }
    return settings;
  }

  /**
   * Configuración visible por cualquier visitante de la tienda.
   * Se devuelven sólo los campos necesarios: el endpoint es público, así que
   * no puede filtrar datos internos como el número de Yape del negocio.
   */
  async getStore() {
    const settings = await this.getOrCreateSettings();
    const socialLinks: any = typeof settings.socialLinks === 'object' && settings.socialLinks !== null ? settings.socialLinks : {};

    return {
      id: settings.id,
      storeName: settings.storeName,
      storeDescription: settings.storeDescription,
      logoUrl: settings.logoUrl,
      bannerUrl: settings.bannerUrl,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      socialLinks,
      branding: socialLinks.branding || {},
      // Métodos de pago disponibles y lo que la clienta necesita para pagar
      paymentCardEnabled: settings.paymentCardEnabled,
      paymentYapeEnabled: settings.paymentYapeEnabled,
      paymentManualEnabled: settings.paymentManualEnabled,
      yapeQrUrl: settings.yapeQrUrl,
      whatsappNumber: settings.whatsappNumber,
      manualPaymentInfo: settings.manualPaymentInfo,
    };
  }

  /** Configuración completa, sólo para el panel de administración. */
  async getStoreAdmin() {
    const settings = await this.getOrCreateSettings();
    const socialLinks: any = typeof settings.socialLinks === 'object' && settings.socialLinks !== null ? settings.socialLinks : {};

    return {
      ...settings,
      branding: socialLinks.branding || {},
    };
  }

  async updateStore(data: any) {
    const settings = await this.prisma.systemSettings.findFirst();
    if (!settings) return null;
    
    let currentSocialLinks: any = typeof settings.socialLinks === 'object' && settings.socialLinks !== null ? settings.socialLinks : {};
    
    // Update top level social links
    if (data.socialLinks) {
        currentSocialLinks = { ...currentSocialLinks, ...data.socialLinks };
    }

    if (data.branding !== undefined) {
      currentSocialLinks.branding = data.branding;
    }

    return this.prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        storeName: data.storeName !== undefined ? data.storeName : undefined,
        storeDescription: data.storeDescription !== undefined ? data.storeDescription : undefined,
        bannerUrl: data.bannerUrl !== undefined ? data.bannerUrl : undefined,
        socialLinks: currentSocialLinks,
        // Configuración de métodos de pago del checkout
        paymentCardEnabled: data.paymentCardEnabled !== undefined ? data.paymentCardEnabled : undefined,
        paymentYapeEnabled: data.paymentYapeEnabled !== undefined ? data.paymentYapeEnabled : undefined,
        paymentManualEnabled: data.paymentManualEnabled !== undefined ? data.paymentManualEnabled : undefined,
        yapeNumber: data.yapeNumber !== undefined ? data.yapeNumber : undefined,
        yapeQrUrl: data.yapeQrUrl !== undefined ? data.yapeQrUrl : undefined,
        whatsappNumber: data.whatsappNumber !== undefined ? data.whatsappNumber : undefined,
        manualPaymentInfo: data.manualPaymentInfo !== undefined ? data.manualPaymentInfo : undefined,
      }
    });
  }

  // FAQ CRUD
  async getFaqs() {
    return this.prisma.faq.findMany({
      orderBy: { position: 'asc' }
    });
  }

  async createFaq(data: { question: string, answer: string }) {
    return this.prisma.faq.create({ data });
  }

  async updateFaq(id: string, data: any) {
    return this.prisma.faq.update({ where: { id }, data });
  }

  async deleteFaq(id: string) {
    return this.prisma.faq.delete({ where: { id } });
  }
}
