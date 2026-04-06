export const storeConfig = {
  vendorWhatsApp: '+5354489573',
  vendorPhoneDisplay: '+53 5448 9573',
  storeName: 'Vainy Bliss',
};

export const formatWhatsAppLink = (message: string): string => {
  return `https://wa.me/${storeConfig.vendorWhatsApp}?text=${encodeURIComponent(message)}`;
};
