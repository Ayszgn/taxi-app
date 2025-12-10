export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  location: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  isOnline: boolean;
} 