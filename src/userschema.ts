import type { FromSchema, JSONSchema } from 'json-schema-to-ts';

export const createUserDtoSchema = {
    type: 'object',
    properties: {
        email: { type: 'string', pattern: '@', maxLength: 255, minLength: 6 },
        password: { type: 'string', maxLength: 255, minLength: 8 },
        confirmPassword: { type: 'string', maxLength: 255, minLength: 8 },
    },
    required: ['email', 'password', 'confirmPassword'],
    maxProperties: 3,
    additionalProperties: false,
} as const satisfies JSONSchema;

export const loginUserDtoSchema = {
    type: 'object',
    properties: {
        email: createUserDtoSchema.properties.email,
        password: createUserDtoSchema.properties.password,
    },
    required: ['email', 'password'],
    maxProperties: 2,
    additionalProperties: false,
} as const satisfies JSONSchema;

export const createLinkDtoSchema = {
    type: 'object',
    properties: {
        url: { type: 'string', format: 'url', maxLength: 2048, minLength: 3 },
        alias: { type: 'string', maxLength: 15, minLength: 5 },
        limit: { type: 'number', description: 'time in seconds' },
    },
    required: ['url'],
    maxProperties: 3,
    additionalProperties: false,
} as const satisfies JSONSchema;

export const getLinkDtoSchema = {
    type: 'object',
    properties: {
        short: { type: 'string', maxLength: 15, minLength: 1 },
    },
    required: ['short'],
    maxProperties: 1,
    additionalProperties: false,
} as const satisfies JSONSchema;

export const mutateLinkDtoSchema = {
    type: 'object',
    properties: {
        short: getLinkDtoSchema.properties.short,
    },
    required: ['short'],
    maxProperties: 1,
    additionalProperties: false,
} as const satisfies JSONSchema;

export const updateLinkDtoSchema = {
    type: 'object',
    properties: {
        alias: createLinkDtoSchema.properties.alias,
    },
    required: ['alias'],
    maxProperties: 1,
    additionalProperties: false,
} as const satisfies JSONSchema;

export const removeUserDtoSchema = {
    type: 'object',
    properties: {
        id: { type: 'number' },
    },
    required: ['id'],
    maxProperties: 1,
    additionalProperties: false,
} as const satisfies JSONSchema;

export type CreateUserDto = FromSchema<typeof createUserDtoSchema>;
export type LoginUserDto = FromSchema<typeof loginUserDtoSchema>;
export type CreateLinkDto = FromSchema<typeof createLinkDtoSchema>;
export type GetLinkDto = FromSchema<typeof getLinkDtoSchema>;
export type MutateLinkDto = FromSchema<typeof mutateLinkDtoSchema>;
export type UpdateLinkDto = FromSchema<typeof updateLinkDtoSchema>;
export type removeUserDto = FromSchema<typeof removeUserDtoSchema>;
