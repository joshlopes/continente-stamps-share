export abstract class AbstractStringVo {
  constructor(protected readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error(`${this.constructor.name} cannot be empty`);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: AbstractStringVo): boolean {
    return this.value === other.value;
  }
}
