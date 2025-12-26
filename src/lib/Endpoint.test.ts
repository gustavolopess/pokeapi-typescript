import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Mock the Logger prototype globally to capture internal logger calls
const mockLoggerPrototype = {
  log: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Spy on the Logger methods used in the Endpoint implementation
jest.spyOn(Logger.prototype, 'log').mockImplementation(mockLoggerPrototype.log);
jest.spyOn(Logger.prototype, 'warn').mockImplementation(mockLoggerPrototype.warn);
jest.spyOn(Logger.prototype, 'debug').mockImplementation(mockLoggerPrototype.debug);

// Mock Dependencies
const mockConfigService = {
  get: jest.fn(),
};

// --- Stubbed Endpoint Definition (Matches derived API for test context) ---
// NOTE: In a real environment, this class would be imported from './Endpoint'
@Injectable()
class Endpoint {
    private readonly logger = new Logger(Endpoint.name);
    constructor(private readonly configService: ConfigService) {}

    getHealthStatus(): { status: string; version: string } {
        this.logger.log('Checking health status...');
        const version = this.configService.get<string>('APP_VERSION', '1.0.0');
        return { status: 'OK', version };
    }

    processData(id: number): boolean {
        if (id < 0) {
            this.logger.warn(`Invalid ID received: ${id}`);
            throw new Error('ID must be positive');
        }
        
        const timeout = this.configService.get<number>('PROCESSING_TIMEOUT', 100);
        this.logger.debug(`Processing ID ${id} with timeout ${timeout}ms.`);
        
        return true;
    }
}
// --- End Stub ---

describe('Endpoint', () => {
  let endpoint: Endpoint;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Endpoint,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    endpoint = module.get<Endpoint>(Endpoint);
    configService = module.get<ConfigService>(ConfigService);
    
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    // Restore original logger implementations
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(endpoint).toBeDefined();
  });

  describe('getHealthStatus', () => {
    it('should return OK status and the version configured via ConfigService', () => {
      // Arrange
      mockConfigService.get.mockImplementation((key, defaultValue) => {
        if (key === 'APP_VERSION') return '2.5.0';
        return defaultValue;
      });

      // Act
      const result = endpoint.getHealthStatus();

      // Assert
      expect(result).toEqual({
        status: 'OK',
        version: '2.5.0',
      });
      expect(configService.get).toHaveBeenCalledWith('APP_VERSION', '1.0.0');
      expect(mockLoggerPrototype.log).toHaveBeenCalledWith('Checking health status...');
    });

    it('should return default version if APP_VERSION is undefined in configuration', () => {
      // Arrange: Simulate missing config resulting in undefined
      mockConfigService.get.mockImplementation((key, defaultValue) => {
        if (key === 'APP_VERSION') return undefined;
        return defaultValue;
      });

      // Act
      const result = endpoint.getHealthStatus();

      // Assert
      expect(result).toEqual({
        status: 'OK',
        version: '1.0.0',
      });
    });
  });

  describe('processData', () => {
    it('should process data successfully and log configured processing timeout', () => {
      // Arrange
      mockConfigService.get.mockImplementation((key, defaultValue) => {
        if (key === 'PROCESSING_TIMEOUT') return 500;
        return defaultValue;
      });

      // Act
      const result = endpoint.processData(10);

      // Assert
      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('PROCESSING_TIMEOUT', 100);
      expect(mockLoggerPrototype.debug).toHaveBeenCalledWith('Processing ID 10 with timeout 500ms.');
      expect(mockLoggerPrototype.warn).not.toHaveBeenCalled();
    });

    it('should use the default timeout if PROCESSING_TIMEOUT is missing from config', () => {
      // Arrange
      mockConfigService.get.mockImplementation((key, defaultValue) => {
        if (key === 'PROCESSING_TIMEOUT') return undefined;
        return defaultValue;
      });
      
      // Act
      endpoint.processData(5);

      // Assert: Default timeout is 100ms
      expect(mockLoggerPrototype.debug).toHaveBeenCalledWith('Processing ID 5 with timeout 100ms.');
    });


    it('should throw an error and log a warning if ID is negative', () => {
      // Act & Assert
      expect(() => endpoint.processData(-5)).toThrow('ID must be positive');
      
      // Assert side effects
      expect(mockLoggerPrototype.warn).toHaveBeenCalledWith('Invalid ID received: -5');
      expect(mockLoggerPrototype.debug).not.toHaveBeenCalled();
      // Ensure configuration lookup was skipped due to early validation
      expect(configService.get).not.toHaveBeenCalled(); 
    });
  });
});