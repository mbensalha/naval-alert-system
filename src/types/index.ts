
export type ShipClassification = 
  | "HOSTILE" 
  | "SUSPECT" 
  | "INCONNU" 
  | "PRESUME AMI" 
  | "NEUTRE" 
  | "AMI";

export interface DetectedShip {
  id: string;
  detectionTime: Date;
  position: {
    lat: number;
    long: number;
  };
  classification: ShipClassification | null;
  screenshot: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
}
