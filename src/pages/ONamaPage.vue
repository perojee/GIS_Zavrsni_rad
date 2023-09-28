<template>
  <q-page>
    <div v-if="isMobile"><h5 class="row justify-center">O nama</h5></div>
    <div v-else><h4 class="row justify-center">O nama</h4></div>

    <div class="row justify-center text-content">
      Ova aplikacija je projekti zadatak u sklopu završnog rada studenta Petra
      Bošnjaka pod mentorstvom dr.sc. Borisa Milašinovića na fakultetu
      strojarstva, računarstva i elektrotehnike u Mostaru. Aplikacija je
      razvijena kao humanitarna pomoć u slučaju prirodnih nepogoda. Korištenjem
      karte korisnici imaju mogućnost objavljivanja lokacije kako bi mogli
      zatražiti ili nuditi pomoć drugim korisnicima u obuhvaćenim područijma.
      Program je open-source što znači da je kod javno dostupan te postoji
      mogućnost unaprijeđivanja od trećih lica. Program je dostupan na:
      https://github.com/perojee/GIS_Zavrsni_rad. Kontakt:
      petar.bosnjak@fsre.sum.ba
    </div>
    <div class="images row justify-between">
      <div class="image-wrapper">
        <img class="image col-2" src="src/assets/Petar.png" alt="" />
        <p class="nice-text">Petar Bošnjak</p>
        <p class="text-under">Developer</p>
      </div>
      <div class="image-wrapper">
        <img class="image col-2" src="src/assets/Petar.png" alt="" />
        <p class="nice-text">Boris Milašinović</p>
        <p class="text-under">Mentor</p>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  computed: {
    isMobile() {
      return this.$q.platform.is.mobile;
    },
  },
};
</script>

<style scoped>
h5,
h4 {
  padding: 0;
  font-size: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.text-content {
  margin: 0 20px 0;
  padding: 0;
  font-family: "Montserrat", sans-serif;
  color: #333;
  line-height: 1.4;
  font-size: 15px;
  letter-spacing: 0.3px;
}
.image {
  border-radius: 50%;
  width: 150px;
  height: 150px;
  object-fit: cover;
  object-position: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin: 90px 13rem 15px;
}
.images {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.image-wrapper {
  text-align: center;
}
.text-under {
  padding: 0;
  font-size: 20px;
  font-family: "Montserrat", sans-serif;
  font-weight: 700;
  color: #333;
  line-height: 1.4;
}
.nice-text {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
}
</style>
