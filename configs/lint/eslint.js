module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parser: 'vue-eslint-parser',
  plugins: ['vue'],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module',
    jsxPragma: 'React',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'quote-props': ['error', 'as-needed'],
    'comma-dangle': ['error', 'always-multiline'],
    'prettier/prettier': 'off',
    'no-unused-vars': 'off',
    'no-use-before-define': 'off',
    'no-multiple-empty-lines': ['error', { max: 2 }], // 空行最多不能超过两行
    'space-infix-ops': ['error', { int32Hint: true }], // 操作符周围的空格
    'space-before-function-paren': [
      'error',
      { anonymous: 'always', named: 'never', asyncArrow: 'always' },
    ], // 函数定义时括号前的空格
    'space-before-blocks': ['error', 'always'], // 在块语句之前始终有一个空格
    'template-curly-spacing': ['off', 'never'], // 要求模板字符串中的嵌入表达式周围空格的使用
    'key-spacing': ['error', { beforeColon: false, afterColon: true }], // 对象字面量中冒号的前后空格
    'array-bracket-spacing': ['off', 'always'], // 数组内前后要求有空格
    'object-curly-spacing': ['error', 'always'], // 对象内前后要求有空格
    'arrow-spacing': ['error', { before: true, after: true }], // 前头=> 前后都有空格
    'comma-spacing': ['error', { before: false, after: true }], // 要求同一行内逗号后面有空格
    'keyword-spacing': 'error', // 关键字前后的空格
    'no-trailing-spaces': 'error', // 一行最后不允许有空格
    'switch-colon-spacing': ['error', { before: false, after: true }], // switch 冒号后要有空格
    'block-scoped-var': 'error', // 将变量声明放在合适的代码块里
    curly: ['error', 'all'], // 强制使用花括号的风格
    'no-multi-spaces': 'error', // 不允许出现多余的空格
    'no-self-compare': 'error', // 不允许自身比较
    eqeqeq: ['error', 'smart'], // 比较的时候使用严格等于

    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],

    'vue/script-setup-uses-vars': 'error',
    'vue/attributes-order': 'off',
    'vue/custom-event-name-casing': 'off',
    'vue/v-on-event-hyphenation': 'off',
    'vue/one-component-per-file': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/attribute-hyphenation': 'off',
    'vue/require-default-prop': 'off',
    'vue/require-explicit-emits': 'off',
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'always',
          normal: 'never',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      },
    ],
    'vue/multi-word-component-names': 'off',
    'vue/mustache-interpolation-spacing': ['error', 'always'],
  },
  globals: {
    // yonyou api
    api: 'readonly',
    $api: 'readonly',
    doApiready: 'readonly',
  },
};
