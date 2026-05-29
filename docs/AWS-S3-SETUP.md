# AWS S3 + CloudFront (substitui Vercel Blob)

## Opção A — Integração Vercel ↔ AWS (o que fizeste)

Na Vercel → projeto **remakepix** → Storage / AWS, a Vercel cria:

- `AWS_ROLE_ARN`
- `AWS_REGION`
- `AWS_RESOURCE_ARN` (ARN do bucket, ex. `arn:aws:s3:::meu-bucket`)

O código **lê o nome do bucket** desse ARN. Também precisas de:

- `DISABLE_VERCEL_BLOB=1`
- **Redeploy** em Production depois de ligar a AWS

Opcional: `AWS_CLOUDFRONT_DOMAIN=dxxxx.cloudfront.net`

## Opção B — Chaves IAM manuais

```
AWS_S3_BUCKET=remakepix-media
AWS_S3_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_CLOUDFRONT_DOMAIN=dxxxxxxxx.cloudfront.net
DISABLE_VERCEL_BLOB=1
```

## Bucket

1. Cria bucket S3 (ex. `eu-west-1`)
2. CORS (para upload PUT do browser):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": ["https://remakepix.com", "https://*.vercel.app"],
    "ExposeHeaders": ["ETag"]
  }
]
```

3. IAM user com política mínima:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::SEU-BUCKET/rp/*"
    }
  ]
}
```

## CloudFront (recomendado)

- Origin: bucket S3
- URL pública nas respostas da API = `https://AWS_CLOUDFRONT_DOMAIN/rp/...`
- Replicate aceita URLs HTTPS públicas

## Testar

`GET https://remakepix.com/api/upload/s3/status` → `{ "s3": true }`

`GET https://remakepix.com/api/health` → `integrations.s3: true`, `blob: false`
