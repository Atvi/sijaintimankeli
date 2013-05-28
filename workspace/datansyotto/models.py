# -*- coding: utf-8 -*-
from django.db import models

class kayttaja(models.Model):
        nick=models.CharField(max_length=32)
        kommentti=models.CharField(max_length=146) #mallia twitteristä + pari bonusmerkkiä
        koord=models.CharField(max_length=19)
        aikaleima=models.DateTimeField(True) #last modified=true
        #def koordinaatit(self):
          #      return self.koord
                #return str(self.koord[0])+","+str(self.koord[1]) #"00.00000,00.00000" #self.koord[0].format_number(self.koord[0]) #,",",self.koord[1]

class ryhma(models.Model):
        nimi=models.CharField(max_length=32)
        salasana=models.CharField(max_length=32)
        luoja=models.ForeignKey(kayttaja, related_name="luoja")
        jasenet=models.ManyToManyField(kayttaja, related_name="jasenet")

class kohde(models.Model):
        nick=models.ForeignKey(kayttaja)
        koord=models.CharField(max_length=50) #oli ennen 19... rikottiinko kaikki???
        voimassa=models.IntegerField() #sekunteina aloitushetkestä
        lahtee=models.IntegerField() #sekunteina aloitushetkestä
        saapuu=models.IntegerField() #sekunteina lähtöhetkestä
        kommentti=models.CharField(max_length=146)
        
