# C:/Users/Mohammed Farhaan/Desktop/HostelmateAI/bedspace_app/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.utils import timezone
from django.db.models import Q


# 1. Custom User Model (Extending Django's AbstractUser)
class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, null=False, blank=False)

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name=('groups'),
        blank=True,
        help_text=(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name="user_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name=('user permissions'),
        blank=True,
        help_text=('Specific permissions for this user.'),
        related_name="user_set",
        related_query_name="user",
    )

    class Meta:
        verbose_name = 'Owner/User'
        verbose_name_plural = 'Owners/Users'

    def __str__(self):
        return self.email

    @property
    def has_active_subscription(self):
        """
        Checks if the user has at least one active subscription whose end_date is in the future.
        """
        return self.subscriptions.filter(
            is_active=True,
            end_date__gte=timezone.now().date()
        ).exists()


# 2. SubscriptionPlan Model
class SubscriptionPlan(models.Model):
    plan_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan_name = models.CharField(max_length=100, unique=True, null=False, blank=False)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=False, blank=False)
    duration_months = models.IntegerField(null=False, blank=False)
    features = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.plan_name

# 3. Subscription Model
class Subscription(models.Model):
    subscription_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions', db_index=True) # <--- INDEXED
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.RESTRICT, related_name='subscribers', db_index=True) # <--- INDEXED
    start_date = models.DateField(null=False, blank=False, db_index=True) # <--- INDEXED
    end_date = models.DateField(null=False, blank=False, db_index=True) # <--- INDEXED
    is_active = models.BooleanField(default=True, db_index=True) # <--- INDEXED
    stripe_subscription_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    paypal_subscription_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Subscriptions"
        unique_together = ('owner', 'plan', 'start_date')

    def __str__(self):
        return f"{self.owner.email}'s {self.plan.plan_name} Subscription"

# 4. Properties Model
class Property(models.Model):
    property_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties', db_index=True) # <--- INDEXED
    property_name = models.CharField(max_length=255, null=False, blank=False)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Properties"
        unique_together = ('owner', 'property_name')

    def __str__(self):
        return f"{self.property_name} ({self.owner.email})"

# 5. Units Model
class Unit(models.Model):
    unit_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='units', db_index=True) # <--- INDEXED
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='units', db_index=True) # <--- INDEXED
    unit_number = models.CharField(max_length=50, null=False, blank=False)
    bedspace_type = models.CharField(max_length=100, null=False, blank=False)
    rent_per_bed = models.DecimalField(max_digits=10, decimal_places=2, null=False, blank=False)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('property', 'unit_number')

    def __str__(self):
        return f"{self.property.property_name} - {self.unit_number}"

# 6. Beds Model
class Bed(models.Model):
    bed_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='beds', db_index=True) # <--- INDEXED
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='beds', db_index=True) # <--- INDEXED
    bed_number = models.CharField(max_length=20, null=False, blank=False)
    location_in_unit = models.CharField(max_length=100, null=False, blank=False)
    is_active = models.BooleanField(default=True, db_index=True) # <--- INDEXED
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('unit', 'bed_number')
        verbose_name_plural = "Beds"

    def __str__(self):
        return f"{self.unit.unit_number} - {self.bed_number} ({self.location_in_unit})"

# 7. Tenants Model
class Tenant(models.Model):
    tenant_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tenants', db_index=True) # <--- INDEXED
    tenant_name = models.CharField(max_length=255, null=False, blank=False)
    contact_number = models.CharField(max_length=20, null=False, blank=False)
    email = models.EmailField(max_length=255, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True)
    identification_number = models.CharField(max_length=255, unique=True, null=True, blank=True)

    class Meta:
        unique_together = ('owner', 'identification_number')

    def __str__(self):
        return self.tenant_name

# 8. BookingAgreement Model
class BookingAgreement(models.Model):
    booking_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='booking_agreements', db_index=True) # <--- INDEXED
    tenant = models.ForeignKey(Tenant, on_delete=models.RESTRICT, related_name='bookings', db_index=True) # <--- INDEXED
    bed = models.ForeignKey(Bed, on_delete=models.RESTRICT, related_name='bookings', db_index=True) # <--- INDEXED
    unit = models.ForeignKey(Unit, on_delete=models.RESTRICT, related_name='bookings_in_unit', db_index=True) # <--- INDEXED
    property = models.ForeignKey(Property, on_delete=models.RESTRICT, related_name='bookings_in_property', db_index=True) # <--- INDEXED
    check_in_date = models.DateField(null=False, blank=False, db_index=True) # <--- INDEXED
    check_out_date = models.DateField(null=False, blank=False, db_index=True) # <--- INDEXED
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2, null=False, blank=False)
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    booking_status = models.CharField(max_length=50, null=False, blank=False, db_index=True) # <--- INDEXED
    agreement_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(check_out_date__gte=models.F('check_in_date')),
                name='check_out_after_check_in'
            )
        ]

    def __str__(self):
        return f"Booking {self.booking_id} for {self.tenant.tenant_name} ({self.bed.bed_number})"

# 9. Payment Model
class Payment(models.Model):
    payment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments', db_index=True) # <--- INDEXED
    booking = models.ForeignKey(BookingAgreement, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments', db_index=True) # <--- INDEXED
    tenant = models.ForeignKey(Tenant, on_delete=models.RESTRICT, related_name='payments', db_index=True) # <--- INDEXED
    payment_date = models.DateField(null=False, blank=False, db_index=True) # <--- INDEXED
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, null=False, blank=False)
    payment_method = models.CharField(max_length=50, default='Cash')
    payment_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Payments"

    def __str__(self):
        return f"Payment {self.amount_paid} from {self.tenant.tenant_name} on {self.payment_date}"

# 10. Expense Model
class Expense(models.Model):
    expense_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses', db_index=True) # <--- INDEXED
    property = models.ForeignKey(Property, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses_for_property', db_index=True) # <--- INDEXED
    units = models.ManyToManyField(Unit, blank=True, related_name='expenses_for_units') # ManyToMany fields automatically create an intermediate table with indexes
    expense_date = models.DateField(null=False, blank=False, db_index=True) # <--- INDEXED
    category = models.CharField(max_length=255, null=False, blank=False)
    sub_category = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=False, blank=False)
    payment_method = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Expenses"

    def __str__(self):
        unit_numbers_list = [unit.unit_number for unit in self.units.all()]
        units_display = ", ".join(unit_numbers_list) if unit_numbers_list else "N/A"
        return f"Expense: {self.category} - {self.amount} on {self.expense_date} (Units: {units_display})"