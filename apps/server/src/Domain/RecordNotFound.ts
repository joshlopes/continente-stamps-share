export class RecordNotFound extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
    this.name = 'RecordNotFound';
  }
}
