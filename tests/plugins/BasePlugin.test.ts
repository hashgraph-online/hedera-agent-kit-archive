import { describe, expect, test, vi, beforeEach } from 'vitest';
import { BasePlugin, PluginContext } from '../../src/plugins/BasePlugin';
import { StructuredTool } from '@langchain/core/tools';
import { HCS10Client } from '../../src/hcs10/HCS10Client';
import { Logger } from '@hashgraphonline/standards-sdk';
import { z } from 'zod';

/**
 * Mock tool class for testing
 */
class MockTool extends StructuredTool {
  name = 'mock_tool';
  description = 'A mock tool for testing';

  schema = z.object({
    input: z.string().describe('Test input')
  });

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    return `Mock result: ${input.input}`;
  }
}

describe('BasePlugin', () => {
  let mockContext: PluginContext;
  let mockLogger: Logger;
  let mockClient: HCS10Client;

  class TestPlugin extends BasePlugin {
    id = 'test-plugin';
    name = 'Test Plugin';
    description = 'A test plugin';
    version = '1.0.0';
    author = 'Test Author';

    getTools(): StructuredTool[] {
      return [new MockTool()];
    }
  }

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as Logger;

    mockClient = {} as HCS10Client;

    mockContext = {
      client: mockClient,
      logger: mockLogger,
      config: {
        testOption: 'test-value'
      }
    };
  });

  test('should initialize with context', async () => {
    const plugin = new TestPlugin();
    await plugin.initialize(mockContext);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context = (plugin as any).context;
    expect(context).toBe(mockContext);
    expect(context.config.testOption).toBe('test-value');
  });

  test('should provide tools', async () => {
    const plugin = new TestPlugin();
    await plugin.initialize(mockContext);

    const tools = plugin.getTools();
    expect(tools).toHaveLength(1);
    expect(tools[0]).toBeInstanceOf(MockTool);
    expect(tools[0].name).toBe('mock_tool');
  });

  test('should have default cleanup implementation', async () => {
    const plugin = new TestPlugin();
    await plugin.initialize(mockContext);

    await expect(plugin.cleanup()).resolves.not.toThrow();
  });

  test('should implement IPlugin interface', () => {
    const plugin = new TestPlugin();

    expect(plugin.id).toBeDefined();
    expect(plugin.name).toBeDefined();
    expect(plugin.description).toBeDefined();
    expect(plugin.version).toBeDefined();
    expect(plugin.author).toBeDefined();
    expect(typeof plugin.initialize).toBe('function');
    expect(typeof plugin.getTools).toBe('function');
    expect(typeof plugin.cleanup).toBe('function');
  });

  test('tool should execute correctly', async () => {
    const plugin = new TestPlugin();
    await plugin.initialize(mockContext);

    const tools = plugin.getTools();
    const tool = tools[0] as MockTool;

    const result = await tool._call({ input: 'test' });
    expect(result).toBe('Mock result: test');
  });
});