# bedspace_app/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    User, Property, Unit, Bed, Tenant, BookingAgreement,
    Payment, Expense, SubscriptionPlan, Subscription
)
from .serializers import (
    CustomUserCreateSerializer, CustomUserSerializer, # Use CustomUserSerializer for UserViewSet
    PropertySerializer, UnitSerializer, BedSerializer,
    TenantSerializer, BookingAgreementSerializer, PaymentSerializer, ExpenseSerializer,
    SubscriptionPlanSerializer, SubscriptionSerializer
)
from django.db.models import Q
from djoser.views import UserViewSet as DjoserUserViewSet # Import Djoser's UserViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .analytics import get_kpis, get_financial_trends, get_expense_categories_breakdown # <--- IMPORT ANALYTICS FUNCTIONS

# ... (Your existing ViewSets and other views) ...


# Base Multi-Tenant ViewSet
class MultiTenantModelViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return self.queryset
        # All multi-tenant models are assumed to have an 'owner' ForeignKey
        return self.queryset.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

# --- Your ViewSets ---

# Djoser's UserViewSet handles /auth/users/ and /auth/users/me/
# We can extend it to use our CustomUserSerializer
class UserViewSet(DjoserUserViewSet):
    # Use CustomUserSerializer for retrieve/list actions
    def get_serializer_class(self):
        if self.action == 'create':
            return CustomUserCreateSerializer
        return CustomUserSerializer

    # Djoser handles permissions for its own actions, but we can override if needed
    # For instance, to restrict listing users to superusers:
    def get_permissions(self):
        if self.action == 'list':
            return [permissions.IsAdminUser()]
        return super().get_permissions()


class PropertyViewSet(MultiTenantModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer

class UnitViewSet(MultiTenantModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer

class BedViewSet(MultiTenantModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer

class TenantViewSet(MultiTenantModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer

class BookingAgreementViewSet(MultiTenantModelViewSet):
    queryset = BookingAgreement.objects.all()
    serializer_class = BookingAgreementSerializer

class PaymentViewSet(MultiTenantModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class ExpenseViewSet(MultiTenantModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

# Subscription Plans are GLOBAL: only admins can create/edit, all authenticated can view
class SubscriptionPlanViewSet(viewsets.ModelViewSet): # <--- ModelViewSet allows CRUD
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer

    def get_permissions(self):
        # Allow superusers to create, update, delete plans
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        # Allow any authenticated user to list or retrieve plans
        return [permissions.IsAuthenticated()] # All authenticated users can view global plans

    # No get_queryset or perform_create methods here, as it's not multi-tenant and not user-owned

class SubscriptionViewSet(MultiTenantModelViewSet):
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    # Subscriptions are user-specific, so they remain MultiTenantModelViewSet.
    # The MultiTenantModelViewSet's perform_create and get_queryset will correctly
    # handle the 'owner' field on the Subscription model.

#Analytics
class DashboardKPIsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        # Call analytics functions
        kpis = get_kpis(user)
        financial_trends = get_financial_trends(user)
        expense_breakdown = get_expense_categories_breakdown(user)

        # Combine all data into a single response
        response_data = {
            'kpis': kpis,
            'financial_trends': financial_trends,
            'expense_breakdown': expense_breakdown,
            # Add more data here as you add more analytics functions
        }

        return Response(response_data)