/** @import { PartsDataConfig, PartDataAttributes } from "./lib/element-parts" */
import fs from 'fs/promises';
import path from 'path';

/**
 * Reads all .def.json files in the components directory
 */
async function readDefinitionFiles() {
  const componentsDir = path.join(process.cwd(), 'components');
  console.log('Reading definition files from:', componentsDir);
  try {
    // Get all files in the components directory
    const files = await fs.readdir(componentsDir);

    // Filter for .def.json files
    const defFiles = files.filter(file => file.endsWith('.def.json'));

    // Read and parse each file
    const definitions = await Promise.all(
      defFiles.map(async (file) => {
        const filePath = path.join(componentsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        return {
          name: path.basename(file, '.def.json'),
          data: /** @type {PartsDataConfig<PartDataAttributes>} */(JSON.parse(content))
        };
      })
    );

    return definitions;
  } catch (error) {
    console.error('Error reading definition files:', error);
    throw error;
  }
}

// Usage example
readDefinitionFiles()
  .then(async definitions => {
    /** @satisfies {HTMLData} */
    const htmlData = {
      version: 1.1,
      tags: definitions.map(({ data }) => ({
        name: data.name,
        description: data.description,
        attributes: Object.entries(data['part-data-attributes']).map(([name, config]) => ({
          name: 'data-' + name,
          description: `${config.description}\nExpected Elements: ${config.expect ? Object.keys(config.expect).join(', ') : 'any element'}`
        }))
      }))
    };

    // Ensure the .html-data directory exists
    const htmlDataDir = path.join(process.cwd(), '.html-data');
    try {
      await fs.access(htmlDataDir);
    } catch (error) {
      // Directory doesn't exist, create it
      console.log('Creating .html-data directory');
      await fs.mkdir(htmlDataDir, { recursive: true });
    }

    // Write the HTML data to a file
    const outputPath = path.join(htmlDataDir, 'part-elements.html-data.json');

    await fs.writeFile(outputPath, JSON.stringify(htmlData, null, 2), 'utf8');
    console.log('HTML data written to:', outputPath);
  })
  .catch(err => {
    console.error('Failed to process definition files:', err);
    process.exit(1);
  });

export { readDefinitionFiles };

/**
 * @typedef HTMLData
 * @prop {1.1} version
 * @prop {TagHTMLData[]} tags
 * @prop {ValueSetHTMLData[]} [valueSets]
 */
/**
 * @typedef TagHTMLData
 * @prop {string} name
 * @prop {string} [description]
 * @prop {AttributeHTMLData[]} [attributes]
 */
/**
 * @typedef AttributeHTMLData
 * @prop {string} name
 * @prop {string} [description]
 * @prop {AttributeValueHTMLData[]} [values]
 * @prop {string} [valueSet]
 */
/**
 * @typedef ValueSetHTMLData
 * @prop {string} name
 * @prop {AttributeValueHTMLData[]} values
 */
/**
 * @typedef AttributeValueHTMLData
 * @prop {string} name
 * @prop {string} [description]
 */