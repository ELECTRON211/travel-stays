// Stock photography from Unsplash (free to use, no attribution required).
const unsplash = (id, width = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`

export const images = {
  hero: unsplash('1520250497591-112f2f40a3f4', 2200),
  lagos: unsplash('1618828665011-0abd973f7bb8', 1400),
  auth: unsplash('1596394516093-501ba68a0ba6', 1600),
  host: unsplash('1600596542815-ffad4c1539a9', 1600),
  tours: unsplash('1469854523086-cc02fe5d8800', 1200),
}

export const propertyTypeImages = {
  apartment: unsplash('1522708323590-d24dbb6b0267', 900),
  guesthouse: unsplash('1566073771259-6a8506099945', 900),
  hotel_room: unsplash('1618773928121-c32242e63f39', 900),
  house: unsplash('1613490493576-7fde63acd811', 900),
}
