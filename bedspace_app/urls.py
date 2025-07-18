# bedspace_app/urls.py

from rest_framework.routers import DefaultRouter
from .views import (
    PropertyViewSet, UnitViewSet, BedViewSet, TenantViewSet,
    BookingAgreementViewSet, PaymentViewSet, ExpenseViewSet,
    SubscriptionPlanViewSet, SubscriptionViewSet
)

router = DefaultRouter()
router.register(r'properties', PropertyViewSet)
router.register(r'units', UnitViewSet)
router.register(r'beds', BedViewSet)
router.register(r'tenants', TenantViewSet)
router.register(r'booking-agreements', BookingAgreementViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscription-plan')
router.register(r'subscriptions', SubscriptionViewSet)


urlpatterns = router.urls