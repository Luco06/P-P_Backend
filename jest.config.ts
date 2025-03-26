import {Config} from "jest"
const config: Config= {
    preset: "ts-jest",
    testEnvironment:"node",
    verbose: true,
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    moduleDirectories: ["node_modules", "src"],
    collectCoverage: false,
    collectCoverageFrom: [ "src/**/*.[ts, js"],
    testMatch: ['**/__tests__/**/*.+(ts|js)', '**/?(*.)+(spec|test).+(ts|js)'],
}
export default config;




