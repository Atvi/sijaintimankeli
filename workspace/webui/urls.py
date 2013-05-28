from django.conf.urls.defaults import *

from webui import views

urlpatterns = patterns('',
  url(r'^$', views.index, name='index'),
  )