echo {"name": "Pdf_encode_decode","version": "1.0.0","description": "Pdf_encode_decode","main": "app.js","scripts": {"test": "echo \"Error: no test specified\" && exit 1" },"author": "Dmitry Bordun","license": "ISC","eslint": "eslint --ignore-path .gitignore .","dependencies": {}} > package.json

call npm install eslint eslint-config-airbnb --save-dev
call node node_modules\eslint\bin\eslint.js --init

call npm install webpack webpack-cli webpack-dev-server --save-dev

call npm install @babel/core @babel/node babel-polyfill babel-loader --save-dev
call npm install @babel/preset-env --save-dev
echo {"presets": ["@babel/preset-env"]} > .babelrc

call npm install stylelint --save-dev
call npm install stylelint-config-recommended --save-dev
echo {"extends": "stylelint-config-recommended"} > .stylelintrc