import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { InvoiceService } from './invoice.service';
import { RefundService } from './refund.service';
import { WebhookService } from './webhook.service';
import { FraudDetectionService } from './fraud-detection.service';
import { WalletService } from './wallet.service';
import { GiftCardService } from './gift-card.service';
import { InstallmentService } from './installment.service';
import { CorporateService } from './corporate.service';
import { SubscriptionService } from './subscription.service';
import { CouponService } from './coupon.service';
import { TaxService } from './tax.service';
import { PDFService } from './pdf.service';
import { StripeGateway } from './gateways/stripe.gateway';
import { TapGateway } from './gateways/tap.gateway';
import { HyperPayGateway } from './gateways/hyperpay.gateway';
import { PayPalGateway } from './gateways/paypal.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    InvoiceService,
    RefundService,
    WebhookService,
    FraudDetectionService,
    WalletService,
    GiftCardService,
    InstallmentService,
    CorporateService,
    SubscriptionService,
    CouponService,
    TaxService,
    PDFService,
    StripeGateway,
    TapGateway,
    HyperPayGateway,
    PayPalGateway,
  ],
  exports: [
    PaymentsService,
    InvoiceService,
    WalletService,
    GiftCardService,
    InstallmentService,
    CorporateService,
    CouponService,
    TaxService,
  ],
})
export class PaymentsModule {}
