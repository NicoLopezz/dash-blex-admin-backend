# Estructura de Base de Datos - Dolarizate (Producción)

**Generado:** 2025-12-15 00:37:56

---

## Índice

- [users](#users)
- [password_reset_tokens](#password_reset_tokens)
- [sessions](#sessions)
- [cache](#cache)
- [cache_locks](#cache_locks)
- [jobs](#jobs)
- [job_batches](#job_batches)
- [failed_jobs](#failed_jobs)
- [personal_access_tokens](#personal_access_tokens)
- [contacts](#contacts)
- [pulse_values](#pulse_values)
- [pulse_entries](#pulse_entries)
- [pulse_aggregates](#pulse_aggregates)
- [faqs](#faqs)
- [notifications](#notifications)
- [exchanges](#exchanges)
- [exchange_rates](#exchange_rates)
- [transactions](#transactions)
- [master_transactions](#master_transactions)
- [bind_transaction_logs](#bind_transaction_logs)
- [transfer_intents](#transfer_intents)
- [master_transaction](#master_transaction)
- [pix_intents](#pix_intents)
- [media](#media)
- [kycs](#kycs)
- [wallets](#wallets)

---

## users

**Creada en:** `0001_01_01_000000_create_users_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| uuid | uuid | unique |
| account_state | string | - |
| email | string | unique |
| dni | string | unique |
| cuit | string | unique |
| name | string | - |
| cvu | string | nullable |
| alias | string | nullable |
| tag | string | nullable, unique |
| uif_agent | boolean | - |
| responsable_agent | boolean | - |
| email_verified_at | timestamp | nullable |
| password | string | - |
| current_team_id | foreignId | nullable |
| profile_photo_path | string(2048) | nullable |
| closed_at | timestamp | nullable |
|  | id | - |
|  | rememberToken | - |
|  | timestamps | - |

### Modificaciones

**Archivo:** `2024_03_29_175405_add_two_factor_columns_to_users_table.php`

**Archivo:** `2024_03_29_175405_add_two_factor_columns_to_users_table.php`

**Archivo:** `2024_05_30_173502_add_cellphone_to_users_table.php`

Columnas añadidas:
- `cellphone` (string) - nullable

**Archivo:** `2024_05_30_173502_add_cellphone_to_users_table.php`

Columnas añadidas:
- `cellphone` (dropColumn) - -

**Archivo:** `2024_06_06_213900_add_cellphone_country_to_users_table.php`

Columnas añadidas:
- `cellphone_country` (string) - nullable

**Archivo:** `2024_06_06_213900_add_cellphone_country_to_users_table.php`

Columnas añadidas:
- `cellphone_country` (dropColumn) - -

**Archivo:** `2024_08_01_231614_add_check_timestamps_to_users_table.php`

Columnas añadidas:
- `alias_last_updated_at` (timestamp) - nullable
- `tag_last_updated_at` (timestamp) - nullable

**Archivo:** `2024_08_01_231614_add_check_timestamps_to_users_table.php`

**Archivo:** `2024_09_17_203619_add_type_to_users_table.php`

**Archivo:** `2024_09_17_203619_add_type_to_users_table.php`

Columnas añadidas:
- `type` (dropColumn) - -

**Archivo:** `2024_10_08_013141_add_users_first_last_name.php`

Columnas añadidas:
- `first_name` (string) - nullable
- `last_name` (string) - nullable

**Archivo:** `2024_10_18_152517_add_sync_gueno_column_user_table.php`

Columnas añadidas:
- `synchronized_gueno` (boolean) - default: false

**Archivo:** `2024_10_18_152517_add_sync_gueno_column_user_table.php`

Columnas añadidas:
- `synchronized_gueno` (dropColumn) - -

**Archivo:** `2025_03_01_105041_add_suspicious_transactions_reset_at_to_users_table.php`

Columnas añadidas:
- `suspicious_transactions_reset_at` (timestamp) - nullable

**Archivo:** `2025_03_01_105041_add_suspicious_transactions_reset_at_to_users_table.php`

Columnas añadidas:
- `suspicious_transactions_reset_at` (dropColumn) - -

**Archivo:** `2025_03_01_105141_add_deposit_limit_to_users_table.php`

Columnas añadidas:
- `deposit_limit` (decimal(64, 0)) - nullable, default: 1200000

**Archivo:** `2025_03_01_105141_add_deposit_limit_to_users_table.php`

Columnas añadidas:
- `deposit_limit` (dropColumn) - -

**Archivo:** `2025_03_06_000941_update_deposit_limit_default_value.php`

Columnas añadidas:
- `deposit_limit` (decimal(64, 0)) - default: 3200000

**Archivo:** `2025_03_06_000941_update_deposit_limit_default_value.php`

Columnas añadidas:
- `deposit_limit` (decimal(64, 0)) - default: 1200000

---

## password_reset_tokens

**Creada en:** `0001_01_01_000000_create_users_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| email | string | - |
| token | string | - |
| created_at | timestamp | nullable |

---

## sessions

**Creada en:** `0001_01_01_000000_create_users_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| id | string | - |
| user_id | foreignId | nullable, indexed |
| ip_address | string(45) | nullable |
| user_agent | text | nullable |
| payload | longText | - |
| last_activity | integer | indexed |

---

## cache

**Creada en:** `0001_01_01_000001_create_cache_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| key | string | - |
| value | mediumText | - |
| expiration | integer | - |

---

## cache_locks

**Creada en:** `0001_01_01_000001_create_cache_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| key | string | - |
| owner | string | - |
| expiration | integer | - |

---

## jobs

**Creada en:** `0001_01_01_000002_create_jobs_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| queue | string | indexed |
| payload | longText | - |
| attempts | unsignedTinyInteger | - |
| reserved_at | unsignedInteger | nullable |
| available_at | unsignedInteger | - |
| created_at | unsignedInteger | - |
|  | id | - |

---

## job_batches

**Creada en:** `0001_01_01_000002_create_jobs_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| id | string | - |
| name | string | - |
| total_jobs | integer | - |
| pending_jobs | integer | - |
| failed_jobs | integer | - |
| failed_job_ids | longText | - |
| options | mediumText | nullable |
| cancelled_at | integer | nullable |
| created_at | integer | - |
| finished_at | integer | nullable |

---

## failed_jobs

**Creada en:** `0001_01_01_000002_create_jobs_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| uuid | string | unique |
| connection | text | - |
| queue | text | - |
| payload | longText | - |
| exception | longText | - |
| failed_at | timestamp | - |
|  | id | - |

---

## personal_access_tokens

**Creada en:** `2024_03_29_175426_create_personal_access_tokens_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| tokenable | morphs | - |
| name | string | - |
| token | string(64) | unique |
| abilities | text | nullable |
| last_used_at | timestamp | nullable |
| expires_at | timestamp | nullable |
|  | id | - |
|  | timestamps | - |

### Índices

- Morph index: tokenable (tokenable_type, tokenable_id)

---

## contacts

**Creada en:** `2024_04_19_170630_create_contacts_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| id | bigIncrements | - |
| uuid | uuid | unique |
| user_id | foreignId | indexed |
| name | string | - |
| address_value | string | - |
| address_type | string | - |
| currency | string | - |
| verified_at | timestamp | nullable |
| info | json | nullable |
|  | timestamps | - |

### Índices

- Index: ['user_id', 'address_value']

### Constraints Únicos

- Unique constraint: ['user_id', 'address_value', 'verified_at']

---

## pulse_values

**Creada en:** `2024_05_23_005317_create_pulse_tables.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| timestamp | unsignedInteger | - |
| type | string | - |
| key | mediumText | - |
|  | id | - |

---

## pulse_entries

**Creada en:** `2024_05_23_005317_create_pulse_tables.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| timestamp | unsignedInteger | - |
| type | string | - |
| key | mediumText | - |
|  | id | - |

---

## pulse_aggregates

**Creada en:** `2024_05_23_005317_create_pulse_tables.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| bucket | unsignedInteger | - |
| period | unsignedMediumInteger | - |
| type | string | - |
| key | mediumText | - |
|  | id | - |

---

## faqs

**Creada en:** `2024_05_28_213933_create_faqs_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| order | integer | nullable |
| question | string | nullable |
| answer | text | nullable |
|  | id | - |
|  | timestamps | - |

---

## notifications

**Creada en:** `2024_06_05_180758_create_notifications_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| id | uuid | - |
| type | string | - |
| notifiable | morphs | - |
| data | text | - |
| read_at | timestamp | nullable |
|  | timestamps | - |

### Índices

- Morph index: notifiable (notifiable_type, notifiable_id)

---

## exchanges

**Creada en:** `2024_06_05_223223_create_exchanges_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| uuid | uuid | unique |
| user_id | foreignId | - |
| quote | jsonb | - |
| base_currency | string | - |
| quote_currency | string | - |
| min_amount_base | jsonb | - |
| min_amount_quote | jsonb | - |
| rate_base_to_quote | jsonb | - |
| rate_quote_to_base | jsonb | - |
| balance_base | jsonb | - |
| balance_quote | jsonb | - |
| transaction | jsonb | nullable |
| status | string | - |
| expired_at | timestamp | - |
| timestamp | timestamp | - |
|  | id | - |
|  | timestamps | - |

### Relaciones (Foreign Keys)

- ``user_id` → `users`.`id``

### Modificaciones

**Archivo:** `2024_06_28_230119_add_wallet_transations_to_exchanges_table.php`

Columnas añadidas:
- `wallet_transactions` (jsonb) - nullable

**Archivo:** `2024_06_28_230119_add_wallet_transations_to_exchanges_table.php`

**Archivo:** `2024_07_05_000910_add_master_tx_id_to_exchanges.php`

Columnas añadidas:
- `master_transaction_id` (foreignId) - nullable

**Archivo:** `2024_07_05_000910_add_master_tx_id_to_exchanges.php`

---

## exchange_rates

**Creada en:** `2024_06_05_224516_create_exchange_rates_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| uuid | uuid | unique |
| base_currency | string | - |
| quote_currency | string | - |
| quote | jsonb | - |
| rate_base_to_quote | jsonb | - |
| rate_quote_to_base | jsonb | - |
| expired_at | timestamp | - |
| timestamp | timestamp | - |
|  | id | - |
|  | timestamps | - |

---

## transactions

**Creada en:** `unknown`

### Modificaciones

**Archivo:** `2024_06_28_222107_add_failed_at_to_transactions.php`

Columnas añadidas:
- `failed_at` (timestamp) - nullable

**Archivo:** `2024_06_28_222107_add_failed_at_to_transactions.php`

**Archivo:** `2024_07_04_234356_add_master_transaction_id_to_transactions.php`

Columnas añadidas:
- `master_transaction_id` (foreignId) - nullable

**Archivo:** `2024_07_04_234356_add_master_transaction_id_to_transactions.php`

---

## master_transactions

**Creada en:** `2024_07_04_233211_create_master_transactions_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| uuid | uuid | unique |
| status | string | - |
| type | string | - |
| bind_tx_id | string | nullable |
|  | id | - |
|  | timestamps | - |

### Modificaciones

**Archivo:** `2024_07_31_230309_add_transaction_ids_to_master_transaction_table.php`

Columnas añadidas:
- `bind_tx_ids` (jsonb) - nullable

**Archivo:** `2025_10_01_000000_add_bind_tx_to_master_transactions_table.php`

Columnas añadidas:
- `bind_tx` (json) - nullable

**Archivo:** `2025_10_01_000000_add_bind_tx_to_master_transactions_table.php`

Columnas añadidas:
- `bind_tx` (dropColumn) - -

---

## bind_transaction_logs

**Creada en:** `2024_07_04_233830_create_bind_transaction_logs_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| uuid | uuid | unique |
| bind_tx_id | string | - |
| request_data | json | - |
| response_data | json | - |
|  | id | - |
|  | timestamps | - |

---

## transfer_intents

**Creada en:** `2024_07_18_230339_create_transfer_intents_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| uuid | uuid | unique |
| user_id | foreignId | - |
| contact_id | foreignId | - |
| type | string | - |
| currency | string | - |
| status | string | - |
|  | id | - |
|  | timestamps | - |

### Relaciones (Foreign Keys)

- ``user_id` → `users`.`id``
- ``contact_id` → `contacts`.`id``

### Modificaciones

**Archivo:** `2024_08_10_000618_add_min_amount_to_transfer_intents_table.php`

Columnas añadidas:
- `min_amount` (json) - nullable

**Archivo:** `2024_08_10_000618_add_min_amount_to_transfer_intents_table.php`

---

## master_transaction

**Creada en:** `unknown`

### Modificaciones

**Archivo:** `2024_07_31_230309_add_transaction_ids_to_master_transaction_table.php`

---

## pix_intents

**Creada en:** `2024_08_15_010824_create_pix_intents_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| uuid | uuid | unique |
| user_id | foreignId | - |
| status | string | - |
| input_currency | string | - |
| base_currency | string | - |
| target_currency | string | - |
| rate_input_to_base | decimal(64, 10) | - |
| rate_base_to_target | decimal(64, 10) | - |
| rate_target_to_input | decimal(64, 10) | - |
| rate_input_to_target | decimal(64, 10) | - |
| commission_rate | decimal(64, 10) | - |
| min_target_amount | string | - |
| min_target_currency | string | - |
| user_input_amount | string | nullable |
| user_input_currency | string | nullable |
| user_from_amount | string | nullable |
| user_from_currency | string | nullable |
| user_target_amount | string | nullable |
| user_target_currency | string | nullable |
| user_comment | string | nullable |
| qr_code_string | string | nullable |
| reference_id | string | nullable |
| expired_at | timestamp | nullable |
|  | id | - |
|  | timestamps | - |

### Relaciones (Foreign Keys)

- ``user_id` → `users`.`id``

---

## media

**Creada en:** `2024_09_19_150415_create_media_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| model | morphs | - |
| collection_name | string | - |
| name | string | - |
| file_name | string | - |
| mime_type | string | nullable |
| disk | string | - |
| conversions_disk | string | nullable |
| size | unsignedBigInteger | - |
| manipulations | json | - |
| custom_properties | json | - |
| generated_conversions | json | - |
| responsive_images | json | - |
| order_column | unsignedInteger | nullable, indexed |
|  | id | - |
| ->nullable()->unique() | uuid | nullable, unique |
|  | nullableTimestamps | - |

### Índices

- Morph index: model (model_type, model_id)

---

## kycs

**Creada en:** `2024_10_02_004437_create_kycs_table.php`

### Columnas

| Columna | Tipo | Atributos |
|---------|------|----------|
| uuid | uuid | - |
| status | string | - |
| user_id | foreignId | - |
|  | id | - |
|  | timestamps | - |

### Relaciones (Foreign Keys)

- ``user_id` → `users`.`id``

### Modificaciones

**Archivo:** `2024_10_08_032051_add_kycs_gueno_fields.php`

Columnas añadidas:
- `email` (string) - nullable
- `first_name` (string) - nullable
- `last_name` (string) - nullable
- `gueno_identity_check_id` (string) - nullable
- `gueno_identity_check_status` (string) - nullable
- `gueno_identity_check_outcome` (string) - nullable
- `gueno_document_check_id` (string) - nullable
- `gueno_document_check_status` (string) - nullable
- `gueno_document_check_outcome` (string) - nullable

**Archivo:** `2024_10_10_132607_add_gueno_dni.php`

Columnas añadidas:
- `gueno_document_number` (string) - nullable

---

## wallets

**Creada en:** `unknown`

### Modificaciones

**Archivo:** `2024_12_11_115151_add_include_ars_commission_to_wallets_table.php`

Columnas añadidas:
- `apply_ars_commission` (boolean) - default: false

**Archivo:** `2024_12_11_115151_add_include_ars_commission_to_wallets_table.php`

Columnas añadidas:
- `apply_ars_commission` (dropColumn) - -

---

