from django.conf.urls.defaults import *

from datansyotto import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url('sijainti/', views.sijainninsyotto, name='sijainninsyotto'), #parametrina vaikka mita
    url('kohde/', views.kohteensyotto, name='kohteensyotto'), #parametrina vaikka mita
    url('listaa/', views.kayttajalista, name='kayttajalista'), #voi ottaa parametrina nickin #'listaa'+r'^(?P<nick>\w+)$'
    #url('lisaaryhma/', views.lisaaryhma, name='lisaaryhma'), #parametrina nick ja nimi NOTE tama on poistettu kaytosta! opitaan git pullaamaan oikeen ennen tyoskentelyn alotusta!
    url('listaaryhmat/', views.listaaryhmat, name='listaaryhmat'), #debuggikayttoon(?), listaa kaikki olemassaolevat ryhmat jasenineen
    url('listaaadminryhmat/', views.listaaadminryhmat, name='listaaadminryhmat'), #listaa ryhmat joissa parametri nick adminina
    url('poistakaikkiryhmat/', views.poistakaikkiryhmat, name='poistakaikkiryhmat'), #debuggikayttoon, poistaa kaikki tunnetut ryhmat
    url('lisaaryhmaan/', views.lisaaryhmaan, name='lisaaryhmaan'), #parametrina nick ja nimi
    url('poistaryhmasta/', views.poistaryhmasta, name='poistaryhmasta'), #parametrina nick ja nimi, ryhma poistuu jos luoja poistuu 
    url('paivitaryhma/', views.paivitaryhma, name='paivitaryhma'), #parametrina nimi, uusi salasana ja uusi(?) kuvaus
    url('kirjaudu/', 'django.contrib.auth.views.login', name='sisaankirjautuminen'),
    url('logout/', 'django.contrib.auth.views.logout_then_login', name='uloskirjautuminen'),
    url('rekisteroidy/', views.rekisteroidy, name='rekisteroidy'),
    )
