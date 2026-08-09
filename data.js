// REDIĢĒ ŠO FAILU, LAI PIEVIENOTU SAVU DZIMTU.
// id jābūt unikālam. parentIds ir vecāku id.
// spouseIds nav obligāti; tos var izmantot vēlāk papildu savienojumiem.

const SITE = {
  title: "Mūsu dzimtas koks",
  subtitle: "Interaktīvs dzimtas koks"
};

const PEOPLE = [
  {
    id: "p1",
    name: "Jānis Bērziņš",
    birth: "1930",
    death: "2010",
    parents: [],
    photo: "",
    place: "Rīga",
    bio: "Šeit ierakstiet īsu biogrāfiju."
  },
  {
    id: "p2",
    name: "Anna Kalniņa",
    birth: "1934",
    death: "2018",
    parents: [],
    photo: "",
    place: "Cēsis",
    bio: "Šeit ierakstiet īsu biogrāfiju."
  },
  {
    id: "p3",
    name: "Pēteris Bērziņš",
    birth: "1958",
    death: "",
    parents: ["p1", "p2"],
    photo: "",
    place: "Rīga",
    bio: "Šeit ierakstiet īsu biogrāfiju."
  },
  {
    id: "p4",
    name: "Ilze Bērziņa",
    birth: "1961",
    death: "",
    parents: ["p1", "p2"],
    photo: "",
    place: "Jelgava",
    bio: "Šeit ierakstiet īsu biogrāfiju."
  },
  {
    id: "p5",
    name: "Māris Bērziņš",
    birth: "1985",
    death: "",
    parents: ["p3"],
    photo: "",
    place: "Rīga",
    bio: "Šeit ierakstiet īsu biogrāfiju."
  }
];
