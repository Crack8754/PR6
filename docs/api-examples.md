# Приклади API CampusHub

Базова адреса: `http://localhost:3000`. У прикладах нижче UUID та час ілюстративні.
Для реальних запитів використовуйте ID, повернений POST. Наприкінці є виконуваний сценарій PowerShell, який підставляє ID автоматично.
Реєстрацію виконуйте до видалення події.

## 1. Переглянути категорії

```http
GET /categories HTTP/1.1
Host: localhost:3000
```

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[
  {"id":"11111111-1111-4111-8111-111111111111","name":"Лекції"},
  {"id":"22222222-2222-4222-8222-222222222222","name":"Зустрічі"},
  {"id":"33333333-3333-4333-8333-333333333333","name":"Майстер-класи"}
]
```

## 2. Створити подію

title і categoryId обов’язкові. description необов’язковий, за замовчуванням порожній рядок.

```http
POST /events HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "title": "Лекція про REST",
  "description": "Основи ресурсно-орієнтованого API",
  "categoryId": "11111111-1111-4111-8111-111111111111"
}
```

```http
HTTP/1.1 201 Created
Location: /events/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json; charset=utf-8

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Лекція про REST",
  "description": "Основи ресурсно-орієнтованого API",
  "categoryId": "11111111-1111-4111-8111-111111111111",
  "createdAt": "2026-10-28T09:00:00.000Z",
  "updatedAt": "2026-10-28T09:00:00.000Z"
}
```

## 3. Отримати список і конкретну подію

```http
GET /events HTTP/1.1
Host: localhost:3000
```

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Лекція про REST",
    "description": "Основи ресурсно-орієнтованого API",
    "categoryId": "11111111-1111-4111-8111-111111111111",
    "createdAt": "2026-10-28T09:00:00.000Z",
    "updatedAt": "2026-10-28T09:00:00.000Z"
  }
]
```

Якщо подій немає, відповідь: 200 з тілом `[]`.

```http
GET /events/2a988f3c-75ee-409f-85b0-ab558482e025 HTTP/1.1
Host: localhost:3000
```

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Лекція про REST",
  "description": "Основи ресурсно-орієнтованого API",
  "categoryId": "11111111-1111-4111-8111-111111111111",
  "createdAt": "2026-10-28T09:00:00.000Z",
  "updatedAt": "2026-10-28T09:00:00.000Z"
}
```

## 4. Часткове оновлення

```http
PATCH /events/2a988f3c-75ee-409f-85b0-ab558482e025 HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"title":"Практикум із REST"}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Практикум із REST",
  "description": "Основи ресурсно-орієнтованого API",
  "categoryId": "11111111-1111-4111-8111-111111111111",
  "createdAt": "2026-10-28T09:00:00.000Z",
  "updatedAt": "2026-10-28T09:01:00.000Z"
}
```

id і createdAt не змінилися. Непередані description та categoryId збережено.
Спроба передати id, createdAt чи updatedAt поверне 400 VALIDATION_ERROR.

## 5. Зареєструвати учасника

```http
POST /events/2a988f3c-75ee-409f-85b0-ab558482e025/registrations HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"participantId":"22222222-2222-4222-8222-222222222222"}
```

```http
HTTP/1.1 201 Created
Location: /events/550e8400-e29b-41d4-a716-446655440000/registrations/33333333-3333-4333-8333-333333333333
Content-Type: application/json; charset=utf-8

{
  "id": "33333333-3333-4333-8333-333333333333",
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "participantId": "22222222-2222-4222-8222-222222222222",
  "createdAt": "2026-10-28T09:02:00.000Z"
}
```

GET за адресою Location повертає 200 і цей самий об’єкт.
GET /events/:id/registrations повертає 200 і масив реєстрацій (або []).

## 6. Повторна реєстрація — 409

Повторіть запит із кроку 5 до тієї самої події з тим самим participantId.

```http
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8
X-Trace-Id: aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa

{
  "statusCode": 409,
  "errorCode": "REGISTRATION_EXISTS",
  "message": "Participant is already registered for this event",
  "path": "/events/550e8400-e29b-41d4-a716-446655440000/registrations",
  "timestamp": "2026-10-28T09:03:00.000Z",
  "traceId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
}
```

У сховищі лишається одна реєстрація для цієї пари.

## 7. Некоректні дані — 400

Запит без title:

```http
POST /events HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"categoryId":"11111111-1111-4111-8111-111111111111"}
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
X-Trace-Id: aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa

{
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "title must be longer than or equal to 1 characters; title must be a string",
  "path": "/events",
  "timestamp": "2026-10-28T09:04:00.000Z",
  "traceId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
}
```

Запит без participantId:

```http
POST /events/550e8400-e29b-41d4-a716-446655440000/registrations HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{}
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
X-Trace-Id: aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa

{
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "participantId must be a UUID",
  "path": "/events/550e8400-e29b-41d4-a716-446655440000/registrations",
  "timestamp": "2026-10-28T09:04:00.000Z",
  "traceId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
}
```

Невідома категорія:

```http
POST /events HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"title":"Нова подія","categoryId":"99999999-9999-4999-8999-999999999999"}
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8
X-Trace-Id: aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa

{
  "statusCode": 400,
  "errorCode": "CATEGORY_NOT_FOUND",
  "message": "Category with id 99999999-9999-4999-8999-999999999999 was not found",
  "path": "/events",
  "timestamp": "2026-10-28T09:04:00.000Z",
  "traceId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
}
```

Невалідний UUID у шляху, наприклад GET /events/abc, також дає 400 із кодом BAD_REQUEST.

## 8. Видалення

```http
DELETE /events/2a988f3c-75ee-409f-85b0-ab558482e025 HTTP/1.1
Host: localhost:3000
```

```http
HTTP/1.1 204 No Content

```

Тіло повністю відсутнє. Реєстрації цієї події також видалено.

## 9. Відсутня або видалена подія — 404

```http
GET /events/2a988f3c-75ee-409f-85b0-ab558482e025 HTTP/1.1
Host: localhost:3000
```

```http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8
X-Trace-Id: aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa

{
  "statusCode": 404,
  "errorCode": "EVENT_NOT_FOUND",
  "message": "Event with id 550e8400-e29b-41d4-a716-446655440000 was not found",
  "path": "/events/550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-10-28T09:05:00.000Z",
  "traceId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
}
```

POST /events/:id/registrations із коректним participantId для відсутньої події повертає таку саму 404 EVENT_NOT_FOUND; path міститиме шлях реєстрації.
Повторний DELETE також повертає 404.

## Виконуваний сценарій PowerShell

Запустіть сервер в одному терміналі, а ці команди — в іншому. UUID події береться з реальної відповіді:

```powershell
$baseUrl = 'http://localhost:3000'
$categories = Invoke-RestMethod "$baseUrl/categories"
$eventBody = @{ title = 'REST Workshop'; categoryId = $categories[0].id } | ConvertTo-Json
$created = Invoke-WebRequest -Method Post -Uri "$baseUrl/events" -ContentType 'application/json' -Body $eventBody
$created.StatusCode
$created.Headers['Location']
$event = $created.Content | ConvertFrom-Json

Invoke-RestMethod "$baseUrl/events"
Invoke-RestMethod "$baseUrl/events/$($event.id)"
Invoke-RestMethod -Method Patch -Uri "$baseUrl/events/$($event.id)" -ContentType 'application/json' -Body '{"title":"Updated Workshop"}'

$registrationBody = @{ participantId = [guid]::NewGuid().ToString() } | ConvertTo-Json
$registrationUrl = "$baseUrl/events/$($event.id)/registrations"
$registration = Invoke-WebRequest -Method Post -Uri $registrationUrl -ContentType 'application/json' -Body $registrationBody
$registration.StatusCode
$registration.Headers['Location']
Invoke-RestMethod "$baseUrl$($registration.Headers['Location'])"

# Очікувана помилка 409:
try {
  Invoke-RestMethod -Method Post -Uri $registrationUrl -ContentType 'application/json' -Body $registrationBody
} catch { $_.ErrorDetails.Message }

$deleted = Invoke-WebRequest -Method Delete -Uri "$baseUrl/events/$($event.id)"
$deleted.StatusCode # 204
$deleted.Content.Length # 0

# Очікувана помилка 404:
try { Invoke-RestMethod "$baseUrl/events/$($event.id)" } catch { $_.ErrorDetails.Message }
```

Час і traceId генеруються на кожний запит. Текст валідаційних повідомлень може залежати від версії бібліотеки; для обробки помилок використовуйте statusCode та errorCode.
