const SD = require('style-dictionary')
const fs = require('fs')

const dir = 'tokens/02_themes'
const themes = fs.readdirSync(dir).map((file) => file.replace('.json', ''))

/**
 * HAVE THE STYLE DICTIONARY CONFIG DYNAMICALLY GENERATED
 */
SD.registerFormat({
  name: 'css/variables',
  formatter: function (dictionary, config) {
    return `/* Auto generated on ${new Date()}, do not edit directly. */

${this.selector} {
${dictionary.allProperties
  .map((prop) => `  --${prop.name}: ${prop.value};`)
  .join('\n')}
      }`
  },
})

/**
 * Transform: Sizes to px
 */
SD.registerTransform({
  name: 'sizes/px',
  type: 'value',
  matcher: function (prop) {
    // You can be more specific here if you only want 'em' units for font sizes
    return [
      'fontSizes',
      'spacing',
      'borderRadius',
      'borderWidth',
      'sizing',
    ].includes(prop.type)
  },
  transformer: function (prop) {
    // You can also modify the value here if you want to convert pixels to ems
    // console.log(prop);
    return parseFloat(prop.original.value) + 'px'
  },
})

/**
 * Transform: Wraps the value of font families in a double-quoted string to make a string literal.
 */
SD.registerTransform({
  name: 'fontFamily/literal',
  type: 'value',
  matcher: function (prop) {
    return ['fontFamilies'].includes(prop.type)
  },
  transformer: function (prop) {
    return `"${prop.original.value}"`
  },
})

/**
 * Transform: Font-weight to number
 * Figma tokens requires a format like: normal, semiBold, etc
 * CSS requires a format like: 400, 600, etc
 * To make this work, we need to add both values to the token. The 'value' holds the figma token value, the 'default' holds the css value.
 *
 * FIXME: This is a hack, but it works. Need to have a more elegant way of transforming the values.
 *        Need references to work when transforming fro Figma to SD.
 */
SD.registerTransform({
  name: `fontWeight/css`,
  type: `value`,
  transitive: true,
  matcher: (prop) => {
    return ['fontWeights'].includes(prop.type)
  },
  transformer: (prop) => {
    // return a number based fontWeight value based on prop.value
    let transformedWeight = () => {
      switch (prop.value) {
        case 'Light':
          return '300'
        case 'Regular':
          return '400'
        case 'SemiBold':
          return '600'
        case 'Bold':
          return '700'
        case 'ExtraBold':
          return '800'
        default:
          return '400'
      }
    }

    let weightToNumber = transformedWeight()

    console.log('fontWeight/css:', prop.value, 'transformed to', weightToNumber)

    return weightToNumber
  },
})

function getStyleDictionaryConfig(theme) {
  console.log('Building:, ', `tokens/themes/${theme}.json`)
  return {
    source: ['tokens/01_base/**/*.+(json)',  `tokens/02_themes/${theme}.json`, 'tokens/03_comp/**/*.+(json)'],
    platforms: {
      web: {
        transforms: [
          'attribute/cti',
          'name/cti/kebab',
          'sizes/px',
          'fontFamily/literal',
          'fontWeight/css',
        ],
        buildPath: `output/`,
        files: [
          {
            destination: `${theme}.css`,
            format: 'css/variables',
            selector: `.${theme}-theme`,
          },
        ],
      },
    },
  }
}

console.log('Build started...')

// PROCESS THE DESIGN TOKENS FOR THE DIFFEREN BRANDS AND PLATFORMS

console.log('themes', themes)

themes.map(function (theme) {
  console.log('\n==============================================')
  console.log(`\nProcessing: [${theme}]`)

  const StyleDictionary = SD.extend(getStyleDictionaryConfig(theme))

  StyleDictionary.buildPlatform('web')

  console.log('\nEnd processing')
})

console.log('\n==============================================')
console.log('\nBuild completed!')
