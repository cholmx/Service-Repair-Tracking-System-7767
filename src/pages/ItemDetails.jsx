import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useServiceOrders } from '../hooks/useServiceOrders';
import { useOrderEditor } from '../hooks/useOrderEditor';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorBanner from '../components/ErrorBanner';
import OrderHeader from '../components/ItemDetails/OrderHeader';
import QuoteAlert from '../components/ItemDetails/QuoteAlert';
import OrderInfoCard from '../components/ItemDetails/OrderInfoCard';
import CustomerCard from '../components/ItemDetails/CustomerCard';
import StatusDetailsCard from '../components/ItemDetails/StatusDetailsCard';
import LineItemsSection from '../components/ItemDetails/LineItemsSection';
import { LaborTotals, PartsTotal, TaxRateInput } from '../components/ItemDetails/OrderTotals';
import StatusHistory from '../components/ItemDetails/StatusHistory';
import SerialHistoryCard from '../components/ScbaHistory/SerialHistoryCard';
import { laborConfig, partsConfig } from '../components/ItemDetails/lineItemConfigs';

const ItemDetails = ({ onPrintReceipt }) => {
  const { id } = useParams();
  const { items, archivedItems, archivedLoaded, loadArchived, updateItem, loading } = useServiceOrders();
  const [archiveFailed, setArchiveFailed] = useState(false);

  const item = items.find((order) => order.id === id) || archivedItems.find((order) => order.id === id);
  const editor = useOrderEditor(item, updateItem);

  // Archived orders are not loaded up front, so look there when the order is not an active one.
  useEffect(() => {
    if (!loading && !item && !archivedLoaded) {
      loadArchived().catch(() => setArchiveFailed(true));
    }
  }, [loading, item, archivedLoaded, loadArchived]);

  if (loading || (!item && !archivedLoaded && !archiveFailed)) {
    return <LoadingSkeleton type="details" />;
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4 font-display">Service Order Not Found</h1>
          <Link to="/tracking" className="text-primary-600 hover:text-primary-700">
            ← Back to Tracking
          </Link>
        </div>
      </div>
    );
  }

  const { isEditing, isEditingCustomer, editData, customerEditData } = editor;
  const needsQuote = item.status === 'needs-quote';
  const canPrint = ['completed', 'ready', 'quote-approval'].includes(item.status);
  const startCustomerEdit = editor.startEditCustomer;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <OrderHeader
          item={item}
          needsQuote={needsQuote}
          canPrint={canPrint}
          isEditing={isEditing}
          isEditingCustomer={isEditingCustomer}
          isSaving={editor.isSaving}
          onPrint={() => onPrintReceipt(item)}
          onEdit={editor.startEdit}
          onSave={isEditingCustomer ? editor.saveCustomer : editor.saveEdit}
          onCancel={isEditingCustomer ? editor.cancelEditCustomer : editor.cancelEdit}
        />

        {editor.saveError && (
          <ErrorBanner
            message={editor.saveError}
            onRetry={isEditingCustomer ? editor.saveCustomer : editor.saveEdit}
            onDismiss={editor.clearSaveError}
          />
        )}

        {needsQuote && <QuoteAlert />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <OrderInfoCard
            item={item}
            isEditing={isEditing}
            isEditingCustomer={isEditingCustomer}
            editData={editData}
            customerEditData={customerEditData}
            onEditField={editor.setEditField}
            onCustomerField={editor.setCustomerField}
            onEdit={startCustomerEdit}
          />
          <CustomerCard
            item={item}
            isEditing={isEditing}
            isEditingCustomer={isEditingCustomer}
            customerEditData={customerEditData}
            onCustomerField={editor.setCustomerField}
            onEdit={startCustomerEdit}
          />
        </div>

        <SerialHistoryCard item={item} />

        <StatusDetailsCard
          item={item}
          isEditing={isEditing}
          editData={editData}
          needsQuote={needsQuote}
          onEditField={editor.setEditField}
        />

        <LineItemsSection
          config={partsConfig}
          isEditing={isEditing}
          items={item.parts}
          editItems={editData?.parts}
          onAdd={editor.parts.add}
          onRemove={editor.parts.remove}
          onChange={editor.parts.change}
          onToggleWarranty={editor.parts.toggleWarranty}
          viewFooter={<PartsTotal item={item} />}
        />

        <LineItemsSection
          config={laborConfig}
          isEditing={isEditing}
          items={item.labor}
          editItems={editData?.labor}
          onAdd={editor.labor.add}
          onRemove={editor.labor.remove}
          onChange={editor.labor.change}
          onToggleWarranty={editor.labor.toggleWarranty}
          editFooter={
            isEditing && (
              <TaxRateInput
                value={editData.tax_rate}
                onChange={(value) => editor.setEditField('tax_rate', value)}
                parts={editData.parts}
                labor={editData.labor}
              />
            )
          }
          viewFooter={<LaborTotals item={item} />}
        />

        <StatusHistory history={item.statusHistory} />
      </motion.div>
    </div>
  );
};

export default ItemDetails;
