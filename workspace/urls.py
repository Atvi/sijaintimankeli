from django.conf.urls.defaults import patterns, include, url
from django.views.static import *
from django.conf import settings
from webui import views

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    url(r'^datansyotto/', include('datansyotto.urls')),
    url(r'^webui/', include('webui.urls')),
    (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
    url(r'^$', include('webui.urls')),
    # Examples:
    # url(r'^$', 'sijaintimankeli.views.home', name='home'),
    # url(r'^sijaintimankeli/', include('sijaintimankeli.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
