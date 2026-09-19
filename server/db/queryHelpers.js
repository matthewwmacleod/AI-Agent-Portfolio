// Small helpers for building parameterized INSERT/UPDATE statements from a
// plain {column: value} object, since pg uses positional $1, $2... placeholders.

export function buildInsert(table, idColumn, idValue, fields) {
  const keys = Object.keys(fields);
  const columns = [idColumn, ...keys];
  const placeholders = columns.map((_, i) => `$${i + 1}`);
  const values = [idValue, ...keys.map((k) => fields[k])];
  const text = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
  return { text, values };
}

export function buildUpdate(table, idColumn, idValue, fields) {
  const keys = Object.keys(fields);
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = [...keys.map((k) => fields[k]), idValue];
  const text = `UPDATE ${table} SET ${setClause} WHERE ${idColumn} = $${keys.length + 1} RETURNING *`;
  return { text, values };
}
