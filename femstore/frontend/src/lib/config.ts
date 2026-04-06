export const storeConfig = {
  vendorWhatsApp: '+5353790537',
  vendorPhoneDisplay: '+53 5379 0537',
  storeName: 'Vainy Bliss',
};

export const formatWhatsAppLink = (message: string): string => {
  return `https://wa.me/${storeConfig.vendorWhatsApp}?text=${encodeURIComponent(message)}`;
};
