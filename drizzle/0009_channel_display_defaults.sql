UPDATE "biz_channel"
SET
  "extra" = jsonb_set(
    jsonb_set(
      jsonb_set(
        coalesce("extra", '{}'::jsonb),
        '{homeDisplay}',
        coalesce("extra" -> 'homeDisplay', '{}'::jsonb),
        true
      ),
      '{homeDisplay,metaDisplay}',
      '"none"'::jsonb,
      true
    ),
    '{homeDisplay,showUpdatedAt}',
    'false'::jsonb,
    true
  ),
  "updated_at" = now()
WHERE "definition_key" = 'solidot.news'
  AND coalesce(
    "extra" #>> '{homeDisplay,metaDisplay}',
    "extra" ->> 'metaDisplay',
    'time'
  ) = 'time';
