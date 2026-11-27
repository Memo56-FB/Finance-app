# Spec Delta

## Purpose

Permitir crear una cuenta con su identificador de acceso y contraseña, conservando la validación, la confirmación del alta y el inicio de sesión explícito.

## ADDED Requirements

### Requirement: Registro con nombre de usuario y contraseña

El formulario de `/singup` SHALL pedir únicamente `username` y `password`. El proxy y la API SHALL aceptar esos dos campos como JSON en `POST /api/auth/register` con CSRF válido. La respuesta de éxito SHALL ser `201` con el objeto que contiene únicamente el nombre de usuario normalizado.

#### Scenario: Alta desde el formulario

- **WHEN** una persona registra `"  ANA_3  "` con una contraseña válida en inglés o español
- **THEN** el formulario envía únicamente `username` y `password`, y la API responde con `{"username":"ana_3"}`
- **AND** la persona ve la confirmación de alta y puede continuar al login. El registro por sí solo no le da acceso a finanzas.

#### Scenario: Cliente anterior con nombre personal

- **WHEN** un cliente envía también un `name` con credenciales de registro válidas
- **THEN** la API ignora el campo, crea la cuenta sin guardar el nombre personal y devuelve el mismo contrato de éxito

### Requirement: Validación y compatibilidad de cuentas

El registro SHALL normalizar el usuario con recorte y minúsculas, admitir de 1 a 254 caracteres del conjunto `[a-z0-9._-]`, y exigir una contraseña no blanca de al menos 8 unidades UTF-16 y hasta 72 bytes UTF-8. SHALL preservar los espacios significativos de la contraseña, la unicidad del usuario y el acceso de las cuentas previas.

#### Scenario: Errores de alta

- **WHEN** el alta con CSRF válido incluye un usuario inválido o una contraseña fuera de límites
- **THEN** la API devuelve `400` con los campos afectados y el formulario ofrece mensajes localizados
- **AND** con datos válidos pero CSRF ausente o inválido, el registro devuelve `403` y no crea la cuenta

#### Scenario: Cuenta anterior con nombre guardado

- **WHEN** alguien intenta registrar de nuevo el usuario de una cuenta existente variando espacios exteriores o mayúsculas
- **THEN** la API devuelve `409`, el formulario marca el usuario y se conservan las credenciales, el nombre histórico y los datos de esa cuenta
