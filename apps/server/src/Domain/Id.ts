import { v7 as uuidv7, validate } from 'uuid';
import { AbstractStringVo } from './AbstractStringVo.js';

export abstract class Id extends AbstractStringVo {
  constructor(value?: string) {
    if (value) {
      if (!validate(value)) {
        throw new Error(`Invalid UUID: ${value}`);
      }
      super(value);
    } else {
      super(uuidv7());
    }
  }

  static generate<T extends Id>(this: new (value?: string) => T): T {
    return new this();
  }

  static fromString<T extends Id>(this: new (value?: string) => T, value: string): T {
    return new this(value);
  }
}
