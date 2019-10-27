module.exports = {
    env: {
        browser: true,
        es6: true,
    },
    extends: ["airbnb-base"],
    globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
    },
    rules: {
        quotes: ["error", "double"],
        radix: "off",
        indent: ["error", 4, { SwitchCase: 1 }],
        "arrow-parens": ["error", "as-needed", { requireForBlockBody: false }],
        "import/extensions": "off",
        "max-len": [
            "error",
            {
                code: 130,
                comments: 150,
                ignoreTrailingComments: true,
                ignoreRegExpLiterals: true,
                ignoreTemplateLiterals: true,
            },
        ],
        "class-methods-use-this": "off",
        // ['error', { exceptMethods: ['toCamelCase'] }],
        "no-underscore-dangle": ["error", { allowAfterThis: true }],
        "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
        "no-constant-condition": ["error", { checkLoops: false }],
        "no-await-in-loop": "off",
        "no-trailing-spaces": ["error", { skipBlankLines: true }],
        "no-multi-assign": "off",
        "no-param-reassign": "off",
        "no-unused-vars": ["error", { vars: "local" }],
        "no-console": ["error", { allow: ["error"] }],
        "no-multi-spaces": [
            "error",
            {
                exceptions: {
                    VariableDeclarator: true,
                    ImportDeclaration: true,
                },
            },
        ],
        "no-mixed-operators": [
            "error",
            {
                groups: [
                    ["&", "|", "^", "~", "<<", ">>", ">>>"],
                    ["==", "!=", "===", "!==", ">", ">=", "<", "<="],
                    ["&&", "||"],
                    ["in", "instanceof"],
                ],
            },
        ],
        "object-curly-spacing": ["error", "always"],
    },
};
