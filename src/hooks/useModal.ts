"use client";
import { useState } from "react";

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: "confirm" | "alert" | "success" | "danger";
  confirmText: string;
  cancelText: string;
  onConfirm?: () => void;
}

export function useModal() {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
    type: "confirm",
    confirmText: "OK",
    cancelText: "Cancel",
  });

  const showModal = (options: Partial<ModalState> & {
    title: string; message: string
  }) => {
    setModal({
      isOpen: true,
      type: "confirm",
      confirmText: "OK",
      cancelText: "Cancel",
      ...options
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: "confirm" | "danger" = "confirm"
  ) => {
    showModal({
      title, message, onConfirm, type,
      confirmText: type === "danger" ? "Delete" : "Confirm",
      cancelText: "Cancel"
    });
  };

  const alert = (title: string, message: string, type: "alert" | "success" = "alert") => {
    showModal({ title, message, type, confirmText: "OK" });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  return { modal, showConfirm, showAlert: alert, closeModal };
}
