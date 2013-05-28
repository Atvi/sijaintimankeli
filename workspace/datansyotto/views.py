# -*- coding: utf-8 -*-
from django.http import HttpResponse
from datansyotto.models import kayttaja, ryhma, kohde
from datetime import datetime
from time import time, mktime
from django.contrib.auth.models import User
from django.template import RequestContext
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.contrib.auth.decorators import login_required

def index(request):
        return HttpResponse("nothing here")
@login_required
def sijainninsyotto(request): #datansyotto/sijainti/?nick=kurppa&kommentti=asd&koord=25.74773,62.24300
        unick=request.GET.get('nick', '')
        ukommentti=request.GET.get('kommentti', '')
        ukoord=request.GET.get('koord', '')
        k=kayttaja()
        k.nick=unick
        k.kommentti=ukommentti
        k.koord=ukoord #[(ukoord[:ukoord.find(",")]), (ukoord[ukoord.find(",")+1:])]
        #k.koord=koord
        k.aikaleima=datetime.fromtimestamp(time())
        vastaus="tallennetaan data "+unick+ukommentti+ukoord
        try:
          v=kayttaja.objects.get(nick=unick)
          v.delete()
        except kayttaja.DoesNotExist:
          vastaus=vastaus+", uusi nick"
        k.save()
        return HttpResponse(vastaus)
@login_required
def kohteensyotto(request): #datansyotto/kohde/?nick=kurppa&kommentti=asd&koord=25.74773,62.24300
        unick=request.GET.get('nick', '')
        ukommentti=request.GET.get('kommentti', '')
        ukoord=request.GET.get('koord', '')
        uvoimassa=request.GET.get('voimassa', '0')
        ulahtee=request.GET.get('lahtee', time())
        vastaus=""
        k=kohde()
        try:
	  k.nick=kayttaja.objects.get(nick=unick)
        except kayttaja.DoesNotExist:
	  vastaus=vastaus+"uusi käyttäjä,"
	  k.nick=kayttaja()
	  k.nick.save()
        k.kommentti=ukommentti
        k.koord=ukoord #[(ukoord[:ukoord.find(",")]), (ukoord[ukoord.find(",")+1:])]
        k.voimassa=uvoimassa
        k.lahtee=ulahtee
        k.saapuu=0 #ei jaksa muuttaa tietokannan rakennetta juuri, tämä ei saa olla null
        #k.koord=koord
        #k.aikaleima=datetime.fromtimestamp(time())
        #vastaus="tallennetaan data "+unick+ukommentti+ukoord
        #try:
          #v=kayttaja.objects.get(nick=unick)
          #v.delete()
        #except kayttaja.DoesNotExist:
        #  vastaus=vastaus+", uusi nick"
        k.save()
        vastaus=vastaus+"kohde asetettu"
        return HttpResponse(vastaus)
@login_required
def kayttajalista(request):
        
        vastaus=""
        unick=request.GET.get('nick', '')
        
        if(unick=="debugdebugdebug"):
	  kayttajat=kayttaja.objects.all()
	else:
	  kayttajat=list()
	  tasmaavatryhmat=list()
	  for r in ryhma.objects.all():
	      if(r.jasenet.filter(nick__contains=unick).count()>0):
		  #if(tasmaavatryhmat is None):
		    tasmaavatryhmat.append(r)
		  #else:
		    #tasmaavatryhmat=tasmaavatryhmat+r
          #tasmaavatryhmat=ryhma.objects.filter(jasenet.nick__contains=unick) #toimii melkeen
                  #if(r.jasenet.contains(unick)):
                   #     tasmaavatryhmat.add(r)
          #vastaus=tasmaavatryhmat[1].nimi #str(tasmaavatryhmat.count()) #jostain syystä näitä on kaks vaikka ryhmiä olis vaan yks. miten filter mahtaa toimia?
          #for k in kayttaja.objects.all(): #rumaa ja epäoptimaalista? toimii toistaiseksi
                  #for ry in tasmaavatryhmat:
                  #if(kayttajat==None):
          for ry in tasmaavatryhmat: #tämä ei ihan vielä
	      for k in ry.jasenet.all(): #.filter(nick__contains=unick):
		  kayttajat.append(k)
		    #print("ryhma tasmaa "+r.nimi)
                  #if(kayttajat==None):
                        #kayttajat=ry.jasenet.filter(nick__contains=unick)
                  #else:
                        #kayttajat=kayttajat+ry.jasenet.filter(nick__contains=unick)
                  #else:
                 #       kayttajat.add(tasmaavatryhmat.filter(jasenet=k))
                #kayttajat=tasmaavatryhmat.filter(jasenet__nick__contains=k)
          #vastaus=str(kayttajat.count())
                          #if(ry.jasenet.contains(k)):
#                                  kayttajat.add(k)
          #1. katso lapi kaikki ryhmat ja keraa ne, joihin nick kuuluu
	  #2. katso lapi kaikki ryhmat joihin nick kuuluu ja keraa kaikki niiden kayttajat
	  #3. listaa kaikkien kerattyjen kayttajien tiedot
        vastaus=vastaus+'<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n<kayttajat>\n'
        #todo ryhmat tahan
        #vastaus = vastaus + '<ryhma ryhmaNimi=\"dummy\">\n'
        if(kayttajat is not None):
	    for k in kayttajat:
                vastaus = vastaus + '<kayttaja nick=\"'+k.nick+'\" kommentti=\"'+k.kommentti+'\" koord=\"'+k.koord+'\" paivitetty=\"'+str(int(time()-mktime(k.aikaleima.timetuple())))+'\" />\n' # 
                
             #   '" />" # +","+k.koord[1]+'" />\n '# paivitetty="'+str(time.time()-aikaleima)+'" />\n''
	#vastaus=vastaus+'<kohde nick=\"dummy\" kommentti=\"\" koord=\"00.00000,00.00000\" voimassa=\"\" lahtee=\"\" saapuu=\"\" kulkuneuvo=\"\" />\n'
	#kohteet=kohde.objects.all()
        vastaus=vastaus+"</kayttajat>\n<kohteet>"
        taman=kohde.objects.all()
	for tk in taman:
		if(time()-tk.lahtee>tk.voimassa*60*60): #kulunut yli voimassaolotuntimäärä
		    tk.delete()
		else:
		  if(kayttajat is not None):
		    for ka in kayttajat:
                        if(ka==tk.nick):
                                vastaus = vastaus + '<kohde nick="'+tk.nick.nick+'" koord="'+tk.koord+'" kommentti="'+tk.kommentti+'" lahtee="'+str(tk.lahtee)+'" voimassa="'+str(tk.voimassa)+'" />\n'
	vastaus=vastaus+"</kohteet>"
        #vastaus=vastaus+"</ryhma>\n"
        return HttpResponse(vastaus)
@login_required
def listaaryhmat(request):
	ryhmat=ryhma.objects.all()
	vastaus="lista ryhmista<br>"
	for r in ryhmat:
		print r.nimi
		vastaus = vastaus + r.nimi + ", salasana "+r.salasana+" jasenia <br>"
		for j in r.jasenet.all():
		  vastaus = vastaus + j.nick + "<br>"
	return HttpResponse(vastaus)
@login_required
def listaaadminryhmat(request):
	ryhmat=ryhma.objects.all()
        unick=request.GET.get('nick', '')
	vastaus=""
	vastaus=vastaus+"<ryhmalista>"
	lista=ryhma.objects.filter(luoja__nick=unick)
	for r in lista:
		vastaus=vastaus+'<ryhma ryhmaNimi="'+r.nimi+'" />'
	vastaus=vastaus+"</ryhmalista>"
	return HttpResponse(vastaus)
@login_required
def lisaaryhma(request): #datansyotto/lisaaryhma/?nick=kurppa&nimi=petolinnut&salasana=lintu #NOTE tätä ei käytetä enää
        unick=request.GET.get('nick', '')
        unimi=request.GET.get('nimi', '')
        uss=request.GET.get('salasana', '')
        vastaus=""
        try:
	  r=ryhma.objects.get(nimi=unimi)
	  vastaus=vastaus+"ryhmä jo olemassa, ei tehty mitään"
	  
	except ryhma.DoesNotExist: #onko vähän huono tapa virheenkäsittelyn käyttö onnistuneessa tilanteessa? en tiedä.
	  r=ryhma()
	  try:
	      r.nimi=unimi
	      r.luoja=kayttaja.objects.get(nick=unick)
	      r.salasana=uss
	      r.save()
	      r.jasenet.add(r.luoja)
	      r.save()
	      vastaus=vastaus+"luotiin ryhmä"
	  except kayttaja.DoesNotExist:
	      vastaus=vastaus+"luoja ei tunnettu"
	    
        return HttpResponse(vastaus)
        
@login_required
def lisaaryhmaan(request):
        unick=request.GET.get('nick', '')
        unimi=request.GET.get('nimi', '')
        uss=request.GET.get('salasana', '')
        vastaus=""
        try:
	  r=ryhma.objects.get(nimi=unimi)
	  if(kayttaja.objects.filter(nick=unick).count()==0):
	    vastaus=vastaus+"tuntematon käyttäjä"
	  elif(r.jasenet.filter(nick__contains=unick).count()>0):
	    vastaus=vastaus+"käyttäjä on jo ryhmässä!"
	  elif(uss==r.salasana):
	    try:
		r.jasenet.add(kayttaja.objects.get(nick=unick))
	    except kayttaja.DoesNotExist:
		kayt=kayttaja()
		kayt.nick=unick
		kayt.save()
		vastaus=vastaus+"uusi käyttäjä,"
		r.jasenet.add(kayt)
	    r.save()
	    vastaus=vastaus+"lisättiin"
	  else:
	    vastaus=vastaus+"väärä salasana"
	except ryhma.DoesNotExist:
          r=ryhma() #ryhmän luominen tuli samaan komentoon
          r.nimi=unimi
          r.luoja=kayttaja.objects.get(nick=unick)
          r.salasana=uss
          r.save()
          r.jasenet.add(r.luoja)
          r.save()
          vastaus=vastaus+"luotiin ryhmä"
                
	  #vastaus=vastaus+"Ryhmä ei olemassa!"
        return HttpResponse(vastaus)
@login_required
def poistaryhmasta(request): #ryhma poistuu jos luoja poistuu
        unick=request.GET.get('nick', '')
        unimi=request.GET.get('nimi', '')
        vastaus=""
        try:
	  r=ryhma.objects.get(nimi=unimi)
	  if(r.jasenet.filter(nick__contains=unick).count()==0):
	    vastaus=vastaus+"käyttäjä ei ryhmässä"
	  else:
	    if(r.luoja.nick==unick):
	      r.delete()
	      vastaus=vastaus+"poistettiin luojan mukana koko ryhmä"
	    else:
	      try:
		r.jasenet.remove(kayttaja.objects.get(nick=unick))
	      except kayttaja.DoesNotExist:
		kayt=kayttaja()
		kayt.nick=unick
		kayt.save()
		vastaus=vastaus+"uusi käyttäjä poistettavaksi,"
		r.jasenet.remove(kayt)
	      r.save()
	      vastaus=vastaus+"poistettiin"
	except ryhma.DoesNotExist:
	  vastaus=vastaus+"Ryhmää ei olemassa!"
        return HttpResponse(vastaus)
      
@login_required
def paivitaryhma(request):
        unimi=request.GET.get('nimi', '')
        uss=request.GET.get('uusisalasana', '')
        vastaus=""
        try:
	  r=ryhma.objects.get(nimi=unimi)
	    #if(r.luoja.nick==unick):
	    #  r.delete()
	    #  vastaus=vastaus+"poistettiin luojan mukana koko ryhmä"
	  r.salasana=uss
	  r.save()
	  vastaus=vastaus+"Päivitettiin"
	except ryhma.DoesNotExist:
	  vastaus=vastaus+"Ryhmää ei olemassa!"
        return HttpResponse(vastaus)
      
@login_required
def poistakaikkiryhmat(request): #vain debug-käyttöön !!!
	ryhma.objects.all().delete()
	return HttpResponse("poistettu")
@login_required
def asetakohde(request):
	return HttpResponse("dummy")
def rekisteroidy(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            new_user = form.save()
            return HttpResponseRedirect("kirjaudu/")
    else:
        form = UserCreationForm()
    return render(request, "registration/register.html", {
        'form': form,
    })
