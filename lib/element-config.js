/** 
 * @template {AttributesConfig} A
 * @param {ElementConfig<A>} elementConfig
 */
export function attributeRecord(elementConfig) {
  const record = Object.fromEntries(Object.entries(elementConfig.attributes).map(([name, config]) => {
    const observe = 'observe-change' in config;
    const attributeConfig = 'observe-change' in config ? config['observe-change'] : config['ignore-change'];
    const values = Object.keys(attributeConfig.values);
    return [
      name,
      {
        observe,
        values,
      }
    ];
  }));
  return /** @type {ElementConfigToAttributeRecord<A>} */ (record);
}

/**
 * @typedef {{ description: string, values: Record<string, string> }} AttributeDefinition
 */
/**
 * @typedef {Record<string, { 'observe-change': AttributeDefinition } | { 'ignore-change': AttributeDefinition }>} AttributesConfig
 */
/**
 * @template {AttributesConfig} A
 * @typedef ElementConfig
 * @prop {string} name - The custom element tag name.
 * @prop {string} [description] - The description of the custom element.
 * @prop {A} attributes - The attributes with their values and description.
 */
/**
 * @template {AttributesConfig} A
 * @typedef {{
 *  [K in keyof A]: {
 *    observe: A[K] extends { 'observe-change': AttributeDefinition } ? true : false;
 *    values: A[K] extends { 'observe-change': { values: infer U} } | { 'ignore-change': { values: infer U} } ? (keyof U)[] : [];
 *  }
 * }} ElementConfigToAttributeRecord
 */