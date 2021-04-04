export interface IResponse<T> {
  error?: string;
  details?: any;
  message?: string;
  success?: T;
}

export interface IP {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
  readme?: string;
  bogon?: boolean;
}

export declare type IIPResponse = IResponse<IP>;
