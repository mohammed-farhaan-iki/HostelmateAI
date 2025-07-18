# bedspace_app/serializers.py

from rest_framework import serializers
from .models import (
    User, SubscriptionPlan, Subscription, Property, Unit, Bed,
    Tenant, BookingAgreement, Payment, Expense
)
from djoser.serializers import UserCreateSerializer, UserSerializer as DjoserUserSerializer

# Custom User Serializer for Djoser (for registration)
class CustomUserCreateSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'password', 'first_name', 'last_name')

# Custom User Serializer for viewing user details (e.g., /auth/users/me/)
class CustomUserSerializer(DjoserUserSerializer):
    has_active_subscription = serializers.ReadOnlyField()

    class Meta(DjoserUserSerializer.Meta):
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'is_active', 'is_staff', 'date_joined', 'last_login', 'has_active_subscription', 'is_superuser')
        read_only_fields = ('email', 'username', 'is_active', 'is_staff', 'date_joined', 'last_login', 'has_active_subscription', 'is_superuser')


# Serializers for your operational models

class PropertySerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')

    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = ('property_id', 'owner')

class UnitSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')
    property_name = serializers.ReadOnlyField(source='property.property_name')

    class Meta:
        model = Unit
        fields = '__all__'
        read_only_fields = ('unit_id', 'owner')

class BedSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')
    unit_number = serializers.ReadOnlyField(source='unit.unit_number')
    property_name = serializers.ReadOnlyField(source='unit.property.property_name')

    class Meta:
        model = Bed
        fields = '__all__'
        read_only_fields = ('bed_id', 'owner')

class TenantSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')

    class Meta:
        model = Tenant
        fields = '__all__'
        read_only_fields = ('tenant_id', 'owner')

class BookingAgreementSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')
    tenant_name = serializers.ReadOnlyField(source='tenant.tenant_name')
    bed_number = serializers.ReadOnlyField(source='bed.bed_number')
    unit_number = serializers.ReadOnlyField(source='bed.unit.unit_number')
    property_name = serializers.ReadOnlyField(source='bed.unit.property.property_name')

    class Meta:
        model = BookingAgreement
        fields = '__all__'
        read_only_fields = ('booking_id', 'owner')

class PaymentSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')
    tenant_name = serializers.ReadOnlyField(source='tenant.tenant_name')
    booking_id_display = serializers.ReadOnlyField(source='booking.booking_id')

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('payment_id', 'owner')

class ExpenseSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')
    property_name = serializers.ReadOnlyField(source='property.property_name')
    unit_numbers = serializers.SerializerMethodField() # <--- CHANGED THIS

    class Meta:
        model = Expense
        fields = '__all__'
        # 'units' should NOT be in read_only_fields if you want to set them via API
        read_only_fields = ('expense_id', 'owner', 'property_name', 'unit_numbers') # Updated here

    # Method to get a list of unit numbers for display
    def get_unit_numbers(self, obj):
        return [unit.unit_number for unit in obj.units.all()] # <--- NEW METHOD

# Serializers for Subscription Plans and Subscriptions
class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'
        read_only_fields = ('plan_id',)

class SubscriptionSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')
    plan_name = serializers.ReadOnlyField(source='plan.plan_name')

    class Meta:
        model = Subscription
        fields = '__all__'
        read_only_fields = ('subscription_id', 'owner')