export const storeConfig = {
  vendorWhatsApp: '+5354489573',
  storeName: 'Vainy Bliss',
};

export const formatWhatsAppLink = (message: string): string => {
  return `https://wa.me/${storeConfig.vendorWhatsApp}?text=${encodeURIComponent(message)}`;
};
