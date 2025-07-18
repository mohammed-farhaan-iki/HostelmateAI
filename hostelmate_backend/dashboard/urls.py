# C:/Users/Mohammed Farhaan/Desktop/HostelmateAI/hostelmate_backend/dashboard/urls.py
from django.urls import path
from .views import DashboardKPIsView

urlpatterns = [
    path('dashboard-kpis/', DashboardKPIsView.as_view(), name='dashboard-kpis'),
]