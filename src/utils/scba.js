// Item types are typed freely, so the app guesses whether an item is an SCBA and the shop can
// correct it per order (the is_scba flag). This must match looks_like_scba() in
// 20261007000100_scba_flag.sql: SCBA or the common typo SBCA, FireHawk, and the G1 and M7 models.
// Gas detectors (Altair, Sensit), loose face pieces and cylinders are not guessed to be SCBAs.
export const looksLikeScba = (itemType) => /scba|sbca|fire ?hawk|\bg1|\bm7\b/i.test(itemType || '')
