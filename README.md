# ALL FINANCE — Premium ko‘p sahifali sayt

Ushbu versiyada:
- premium bosh sahifa;
- 8 ta xizmat uchun alohida sahifa;
- alohida jamoa sahifasi;
- jamoa ro‘yxatini bitta fayldan boshqarish;
- jamoa suratlarini `assets/team` papkasiga yuklash;
- ishlaydigan tarif kalkulyatori;
- mobil menyu va moslashuvchan dizayn;
- Render/GitHub Pages uchun tayyor tuzilma mavjud.

## GitHub/Render’da yangilash

1. Repozitoriydagi eski fayllarni ushbu paketdagi fayllar bilan almashtiring.
2. `index.html`, `team.html`, `services` va `assets` papkalari repository root qismida bo‘lsin.
3. Commit qiling. Render Auto-Deploy yoqilgan bo‘lsa, sayt avtomatik yangilanadi.

## Jamoa a’zosini qo‘shish

1. Suratni `assets/team` papkasiga yuklang.
2. `assets/js/team-data.js` faylini oching.
3. Mavjud obyekt blokidan nusxa oling va ma’lumotlarni o‘zgartiring.

Misol:
```js
{
  name: "Aziza Karimova",
  role: "Bosh buxgalter",
  category: "accounting",
  categoryLabel: "Buxgalteriya",
  specialty: "Buxgalteriya autsorsingi va moliyaviy hisobot.",
  startYear: 2015,
  photo: "assets/team/aziza-karimova.jpg",
  initials: "AK"
}
```

Tajriba yili joriy yildan avtomatik hisoblanadi.

## Aloqa ma’lumotlarini o‘zgartirish
`assets/js/config.js` faylini tahrirlang.

## Xizmat tavsiflarini o‘zgartirish
`assets/js/services-data.js` faylini tahrirlang. Har bir xizmatning alohida sahifasi shu ma’lumotlardan avtomatik tuziladi.
