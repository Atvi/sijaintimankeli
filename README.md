sijaintimankeli
===============

Aineopintojen projektikurssilla toteutetun sovelluksen Sijaintimankeli julkinen repo


Ohjeita koodin käyttöönottoon:

1. Varmista, että sinulla on Django 1.5 asennettuna. Djangon omilla sivuilla on asennukseen hyvät ohjeet: https://www.djangoproject.com/download/. Suositeltava vaihtoehto on pip:n käyttö (useimmissa linux distroissa on kirjoittamisen hetkellä oletuksena tarjolla vanhempi Django)

2. Tarkista settings.py ja muuta siellä tarvittavat tiedostopolut (ainakin LOGIN_URL, LOGIN_REDIRECT_URL ja TEMPLATE_DIRS)

3. Tee itsellesi SECRET_KEY, jonka voit laittaa settings.py (omamme olemme ottaneet pois julkisesta esittelystä):
4. django-admin.py startproject [nimi] (kannattaa siirtyä pois Sijaintimankelin kansioista ennen tämän suorittamista)
5. Siirry kansioon [nimi]/[nimi]
6. Kopioi täällä olevasta settings.py:stä secret-key ja liitä se varsinaisen projektin settings.py kohtaan SECRET_KEY

Jos ja kun tulee ongelmia, suosittelen tarkistamaan mallikomentoja.txt ja datansyotto/urls.py + Djangon dokumentaatio

Jos ilmenee ongelmia, joista et selviydy yksin, tai haluat muuten vain tietää, ota yhteyttä Atte Rätyyn (yhteystiedot löytyvät yousource versiosta "sijaintimankeli").
