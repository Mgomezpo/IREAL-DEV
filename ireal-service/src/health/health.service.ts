import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getAppVersion } from '../common/version.util';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  getHealth() {
    return {
      status: 'ok',
      service: 'ireal-service',
      version: getAppVersion(),
      environment: this.configService.get<string>('NODE_ENV'),
    };
  }
}
