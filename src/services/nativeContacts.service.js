import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';

const cleanPhoneNumber = (phone) => phone?.replace(/[^\d+]/g, '') || '';

class NativeContactsService {
  isAvailable() {
    return Capacitor.isNativePlatform();
  }

  async pickContact() {
    if (!this.isAvailable()) {
      throw new Error('La sélection de contacts est disponible dans l’application mobile.');
    }

    const permission = await Contacts.requestPermissions();
    if (permission.contacts !== 'granted' && permission.contacts !== 'limited') {
      throw new Error('Autorisez PayTranche à accéder aux contacts du téléphone.');
    }

    const { contact } = await Contacts.pickContact({
      projection: {
        name: true,
        phones: true
      }
    });

    const primaryPhone =
      contact.phones?.find((phone) => phone.isPrimary)?.number ||
      contact.phones?.[0]?.number ||
      '';

    if (!primaryPhone) {
      throw new Error('Ce contact ne possède pas de numéro de téléphone.');
    }

    return {
      name: contact.name?.display || contact.name?.given || 'Client',
      phone: cleanPhoneNumber(primaryPhone)
    };
  }
}

export const nativeContactsService = new NativeContactsService();
