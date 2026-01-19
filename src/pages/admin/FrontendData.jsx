import { useEffect, useState } from "react";
import api from "../../utils/api";
import Modal from "../../components/Modal";
import ActionButtons from "../../components/ActionButtons";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useLanguage } from "../../contexts/LanguageContext";
import { t } from "../../utils/translations";
import { showSuccess, showError } from "../../utils/toast";
import { FiSearch, FiPlus, FiCode } from "react-icons/fi";

const FrontendData = () => {
    const { language } = useLanguage();
    const [frontendData, setFrontendData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingData, setEditingData] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        type: "",
        description: "",
    });
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        onConfirm: null,
        message: "",
    });

    useEffect(() => {
        fetchFrontendData();
    }, []);

    const fetchFrontendData = async () => {
        try {
            const response = await api.get("/frontend-data");
            if (response.data.success) {
                setFrontendData(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching frontend data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (data = null) => {
        if (data) {
            setEditingData(data);
            setFormData({
                title: data.title || "",
                subtitle: data.subtitle || "",
                type: data.type || "",
                description: data.description || "",
            });
        } else {
            setEditingData(null);
            setFormData({
                title: "",
                subtitle: "",
                type: "",
                description: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingData(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingData) {
                await api.put(`/frontend-data/${editingData.id}`, formData);
            } else {
                await api.post("/frontend-data", formData);
            }
            fetchFrontendData();
            handleCloseModal();
            showSuccess(
                editingData ? t("updated", language) : t("saved", language)
            );
        } catch (error) {
            console.error("Error saving frontend data:", error);
            showError(error.response?.data?.message || t("failed", language));
        }
    };

    const handleDelete = async (id) => {
        setConfirmDialog({
            isOpen: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/frontend-data/${id}`);
                    fetchFrontendData();
                    showSuccess(t("deleted", language));
                } catch (error) {
                    console.error("Error deleting frontend data:", error);
                    showError(t("failed", language));
                }
            },
            message: t("deleteConfirm", language),
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    const filteredData = frontendData.filter((data) => {
        const matchesSearch =
            !searchTerm ||
            data.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || data.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const uniqueTypes = [...new Set(frontendData.map((d) => d.type))];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {t("frontendData", language)}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage frontend content and sections
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                    <FiPlus className="mr-2" size={20} />
                    {t("addFrontendData", language)}
                </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FiSearch
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                        <input
                            type="text"
                            placeholder={t("search", language) + "..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="relative">
                        <FiCode
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                            <option value="all">
                                {t("type", language)}: {t("viewAll", language)}
                            </option>
                            {uniqueTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t("title", language)}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t("subtitle", language)}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t("type", language)}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t("actions", language)}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="4"
                                    className="px-6 py-12 text-center"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="text-gray-400 mb-2">
                                            <FiCode size={48} />
                                        </div>
                                        <p className="text-gray-500 font-medium">
                                            {t("noData", language)}
                                        </p>
                                        {searchTerm && (
                                            <p className="text-gray-400 text-sm mt-1">
                                                {t('tryAdjustingYourSearch', language) || 'Try adjusting your search or filters'}
                                            </p>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((data) => (
                                <tr
                                    key={data.id}
                                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-colors duration-150"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <FiCode
                                                className="mr-2 text-blue-600"
                                                size={18}
                                            />
                                            <div className="text-sm font-semibold text-gray-900">
                                                {data.title || "-"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600">
                                            {data.subtitle || "-"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                            {data.type || "-"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <ActionButtons
                                            onEdit={() => handleOpenModal(data)}
                                            onDelete={() =>
                                                handleDelete(data.id)
                                            }
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={
                    editingData
                        ? t("editFrontendData", language)
                        : t("addFrontendData", language)
                }
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("type", language)}
                        </label>
                        <input
                            type="text"
                            value={formData.type}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    type: e.target.value,
                                })
                            }
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g., hero, about, features"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("title", language)}
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    title: e.target.value,
                                })
                            }
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("subtitle", language)}
                        </label>
                        <input
                            type="text"
                            value={formData.subtitle}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    subtitle: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("description", language)}
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows="5"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            {t("cancel", language)}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            {editingData
                                ? t("update", language)
                                : t("create", language)}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() =>
                    setConfirmDialog({
                        isOpen: false,
                        onConfirm: null,
                        message: "",
                    })
                }
                onConfirm={confirmDialog.onConfirm || (() => {})}
                message={confirmDialog.message}
                type="danger"
            />
        </div>
    );
};

export default FrontendData;
