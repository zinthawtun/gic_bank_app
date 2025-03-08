/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
    "^@data/(.*)$": "<rootDir>/data/$1",
    "^@models/(.*)$": "<rootDir>/src/models/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@data-access/(.*)$": "<rootDir>/src/data-access/$1",
    "^@utilities/(.*)$": "<rootDir>/src/utilities/$1",
    "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testPathIgnorePatterns: ["/node_modules/"],
  roots: ["<rootDir>/src", "<rootDir>/test"],
};
