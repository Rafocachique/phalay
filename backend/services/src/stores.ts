import { prisma } from '@phalay/database';

export const storesService = {
  async getOrCreateSettings() {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          storeName: 'PHALAY',
        },
      });
    }
    return settings;
  },

  async getStore() {
    const settings = await this.getOrCreateSettings();
    const socialLinks: any =
      typeof settings.socialLinks === 'object' && settings.socialLinks !== null
        ? settings.socialLinks
        : {};

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
      paymentCardEnabled: settings.paymentCardEnabled,
      paymentYapeEnabled: settings.paymentYapeEnabled,
      paymentManualEnabled: settings.paymentManualEnabled,
      yapeQrUrl: settings.yapeQrUrl,
      whatsappNumber: settings.whatsappNumber,
      manualPaymentInfo: settings.manualPaymentInfo,
    };
  },

  async getStoreAdmin() {
    const settings = await this.getOrCreateSettings();
    const socialLinks: any =
      typeof settings.socialLinks === 'object' && settings.socialLinks !== null
        ? settings.socialLinks
        : {};

    return {
      ...settings,
      branding: socialLinks.branding || {},
    };
  },

  async updateStore(data: any) {
    const settings = await this.getOrCreateSettings();

    let currentSocialLinks: any =
      typeof settings.socialLinks === 'object' && settings.socialLinks !== null
        ? settings.socialLinks
        : {};

    if (data.socialLinks) {
      currentSocialLinks = { ...currentSocialLinks, ...data.socialLinks };
    }

    if (data.branding !== undefined) {
      currentSocialLinks.branding = data.branding;
    }

    return prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        storeName: data.storeName !== undefined ? data.storeName : undefined,
        storeDescription: data.storeDescription !== undefined ? data.storeDescription : undefined,
        bannerUrl: data.bannerUrl !== undefined ? data.bannerUrl : undefined,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : undefined,
        contactEmail: data.contactEmail !== undefined ? data.contactEmail : undefined,
        contactPhone: data.contactPhone !== undefined ? data.contactPhone : undefined,
        socialLinks: currentSocialLinks,
        paymentCardEnabled: data.paymentCardEnabled !== undefined ? data.paymentCardEnabled : undefined,
        paymentYapeEnabled: data.paymentYapeEnabled !== undefined ? data.paymentYapeEnabled : undefined,
        paymentManualEnabled: data.paymentManualEnabled !== undefined ? data.paymentManualEnabled : undefined,
        yapeNumber: data.yapeNumber !== undefined ? data.yapeNumber : undefined,
        yapeQrUrl: data.yapeQrUrl !== undefined ? data.yapeQrUrl : undefined,
        whatsappNumber: data.whatsappNumber !== undefined ? data.whatsappNumber : undefined,
        manualPaymentInfo: data.manualPaymentInfo !== undefined ? data.manualPaymentInfo : undefined,
      },
    });
  },

  async getFaqs() {
    return prisma.faq.findMany({
      orderBy: { position: 'asc' },
    });
  },

  async createFaq(data: { question: string; answer: string }) {
    return prisma.faq.create({ data });
  },

  async updateFaq(id: string, data: any) {
    return prisma.faq.update({ where: { id }, data });
  },

  async deleteFaq(id: string) {
    return prisma.faq.delete({ where: { id } });
  },
};
