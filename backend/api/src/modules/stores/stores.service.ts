import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DEFAULT_PRIVACY_CONTENT, DEFAULT_TERMS_CONTENT } from './legal-defaults';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateSettings() {
    let settings = await this.prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          storeName: 'Mi Tienda',
          legalPrivacyContent: DEFAULT_PRIVACY_CONTENT,
          legalTermsContent: DEFAULT_TERMS_CONTENT,
        }
      });
    }
    if (!settings.legalPrivacyContent || !settings.legalTermsContent) {
      settings = await this.prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          legalPrivacyContent: settings.legalPrivacyContent || DEFAULT_PRIVACY_CONTENT,
          legalTermsContent: settings.legalTermsContent || DEFAULT_TERMS_CONTENT,
        },
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
    // /stores se consulta desde cualquier navegador. Sólo puede contener
    // información que ya se muestra en la portada; no datos de contacto,
    // legales, pagos ni identificadores internos.
    const publicSocialLinks = {
      instagram: typeof socialLinks.instagram === 'string' ? socialLinks.instagram : '',
      facebook: typeof socialLinks.facebook === 'string' ? socialLinks.facebook : '',
      tiktok: typeof socialLinks.tiktok === 'string' ? socialLinks.tiktok : '',
      whatsapp: typeof socialLinks.whatsapp === 'string' ? socialLinks.whatsapp : '',
    };
    const sourceBranding = socialLinks.branding && typeof socialLinks.branding === 'object' ? socialLinks.branding : {};
    const branding = {
      heroTitle: typeof sourceBranding.heroTitle === 'string' ? sourceBranding.heroTitle : undefined,
      heroSubtitle: typeof sourceBranding.heroSubtitle === 'string' ? sourceBranding.heroSubtitle : undefined,
      heroTextPosition: typeof sourceBranding.heroTextPosition === 'string' ? sourceBranding.heroTextPosition : undefined,
      heroTextColor: typeof sourceBranding.heroTextColor === 'string' ? sourceBranding.heroTextColor : undefined,
      heroTextShadow: typeof sourceBranding.heroTextShadow === 'string' ? sourceBranding.heroTextShadow : undefined,
      heroFontStyle: typeof sourceBranding.heroFontStyle === 'string' ? sourceBranding.heroFontStyle : undefined,
      heroOverlayOpacity: typeof sourceBranding.heroOverlayOpacity === 'number' ? sourceBranding.heroOverlayOpacity : undefined,
    };
    return {
      storeName: settings.storeName,
      storeDescription: settings.storeDescription,
      logoUrl: settings.logoUrl,
      bannerUrl: settings.bannerUrl,
      socialLinks: publicSocialLinks,
      branding,
    };
  }

  /** Configuración de pago mínima para una sesión autenticada. */
  async getCheckoutSettings() {
    const settings = await this.getOrCreateSettings();
    return {
      paymentCardEnabled: settings.paymentCardEnabled,
      paymentYapeEnabled: settings.paymentYapeEnabled,
      paymentManualEnabled: settings.paymentManualEnabled,
      // Un QR y el destino de WhatsApp se muestran a la persona que eligió
      // pago manual; no son claves ni otorgan acceso a la cuenta bancaria.
      ...(settings.paymentManualEnabled ? {
        yapeQrUrl: settings.yapeQrUrl,
        whatsappNumber: settings.whatsappNumber,
        manualPaymentInfo: settings.manualPaymentInfo,
      } : {}),
    };
  }

  /** Información legal que debe poder leer cualquier visitante. */
  async getLegalDocuments() {
    const settings = await this.getOrCreateSettings();
    return {
      storeName: settings.storeName,
      legalName: settings.legalName,
      businessRuc: settings.businessRuc,
      businessAddress: settings.businessAddress,
      contactEmail: settings.contactEmail,
      legalPrivacyContent: settings.legalPrivacyContent,
      legalTermsContent: settings.legalTermsContent,
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

  /** Estado seguro de Culqi: sólo confirma configuración, nunca expone llaves. */
  getPaymentGatewayStatus() {
    const secret = process.env.CULQI_SECRET_KEY || '';
    const publicKey = process.env.CULQI_PUBLIC_KEY || process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY || '';
    const mode = secret.startsWith('sk_live_') ? 'PRODUCTION' : secret.startsWith('sk_test_') ? 'TEST' : 'UNCONFIGURED';
    return {
      provider: 'CULQI',
      mode,
      secretKeyConfigured: Boolean(secret),
      publicKeyConfigured: Boolean(publicKey),
      webhookConfigured: Boolean(process.env.CULQI_WEBHOOK_SECRET),
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
        contactEmail: data.contactEmail !== undefined ? data.contactEmail : undefined,
        contactPhone: data.contactPhone !== undefined ? data.contactPhone : undefined,
        legalName: data.legalName !== undefined ? data.legalName : undefined,
        businessRuc: data.businessRuc !== undefined ? data.businessRuc : undefined,
        businessAddress: data.businessAddress !== undefined ? data.businessAddress : undefined,
        legalPrivacyContent: data.legalPrivacyContent !== undefined ? String(data.legalPrivacyContent).slice(0, 20000) : undefined,
        legalTermsContent: data.legalTermsContent !== undefined ? String(data.legalTermsContent).slice(0, 20000) : undefined,
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
