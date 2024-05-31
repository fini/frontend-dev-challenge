import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FieldError, UseFormRegister } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "~/components/ui/sheet"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Checkbox } from "~/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { ToastAction } from "~/components/ui/toast"
import { useToast } from "~/components/ui/use-toast"
import { InvalidateQueryFilters, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar } from "~/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import { TimePicker } from "~/components/ui/time-picker";
import Head from "next/head";
import Layout from "~/components/layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn, fetchData } from "~/utils";
import type { ReturnType } from "./api/voyage/getAll";
import type { VesselsType } from "./api/vessel/getAll";
import type { UnitTypes } from "./api/unitType/getAll";
import { Button } from "~/components/ui/button";
import { TABLE_DATE_FORMAT } from "~/constants";

type FormData = {
  departure: Date;
  arrival: Date;
  portOfLoading: string;
  portOfDischarge: string;
  vessel: string;
  unitType: string[];
};

const voyageFormSchema = z.object({
  departure: z.date({
    required_error: "A date is required.",
  }),
  arrival: z.date({
    required_error: "A date is required.",
  }),
  vessel: z.string().min(2, {
    message: "Vessel is a required field.",
  }),
  portOfLoading: z.string().min(1, {
    message: "Port of loading is a required field.",
  }),
  portOfDischarge: z.string().min(1, {
    message: "Port of discharge is a required field.",
  }),
  unitTypes: z.array(z.string()).refine((value) => value.length >= 5, {
    message: "You have to select at least five Unit Types.",
  }),
}).refine((data) => {
  const departure = new Date(data.departure);
  const arrival = new Date(data.arrival);
  return departure < arrival;
}, {
  message: "Departure must be before arrival date.",
  path: ['arrival'],
});


export default function Home() {

  const voyageForm = useForm<z.infer<typeof voyageFormSchema>>({
    resolver: zodResolver(voyageFormSchema),
    defaultValues: {
      departure: undefined,
      arrival: undefined,
      portOfLoading: "",
      portOfDischarge: "",
      vessel: "-",
      unitTypes: [],
    },
  })

  const { reset } = voyageForm;
  const { isSubmitting, isSubmitSuccessful } = voyageForm.formState;

  useEffect(() => {
    isSubmitSuccessful && reset()
  
  }, [isSubmitSuccessful, reset])

  const { toast } = useToast()

  const { data: voyages } = useQuery<ReturnType>({
    queryKey: ["voyages"],

    queryFn: () =>
      fetchData("voyage/getAll")
  });

  const { data: vessels } = useQuery<VesselsType>({
    queryKey: ["vessels"],

    queryFn: () =>
      fetchData("vessel/getAll")
  });

  const { data: unitTypes } = useQuery<UnitTypes>({
    queryKey: ["unitTypes"],

    queryFn: () =>
      fetchData("unitType/getAll")
  });


  const queryClient = useQueryClient();
  const deleteVoyageMutation = useMutation({
    mutationFn: async (voyageId: string) => {
      const response = await fetch(`/api/voyage/delete?id=${voyageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error: Could not delete voyage.",
          description: `A problem occured while attempting to delete voyage (id: ${voyageId}).`,
          action: <ToastAction altText="Try again" onClick={() => handleDelete(voyageId)}>Try again</ToastAction>,
        })
        throw new Error("Failed to delete the voyage");
      } else {
        toast({
          variant: "default",
          // title: "Voyage succesfully deleted",
          description: `Voyage succesfully deleted.`,
        })
      }
    },
   	onSuccess: async () => {
        await queryClient.invalidateQueries(["voyages"] as InvalidateQueryFilters);
      },
    }
  );

  const handleDelete = (voyageId: string) => {
    deleteVoyageMutation.mutate(voyageId);
  };


  const createVoyageMutation = useMutation({
    mutationFn: async (voyageData: object) => {
      const response = await fetch(`/api/voyage/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(voyageData),
      });

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error: Could not create voyage.",
          description: `A problem occured while attempting to create voyage´.`,
          action: <ToastAction altText="Try again" onClick={() => handleCreate(voyageData)}>Try again</ToastAction>,
        });
        throw new Error("Failed to delete the voyage");
      } else {
        toast({
          variant: "default",
          description: `Voyage succesfully created.`,
        });
      }
    },
   	onSuccess: async () => {
        setOpen(false);
        await queryClient.invalidateQueries(["voyages"] as InvalidateQueryFilters);
      },
    }
  );

  const handleCreate = (voyageData: object) => {
    createVoyageMutation.mutate(voyageData);
  };

  function onSubmit(values: z.infer<typeof voyageFormSchema>) {
    console.log(values);
    handleCreate(values);
  }


  const [open, setOpen] = useState(false)
  
  return (
    <>
      <Head>
        <title>Voyages | DFDS</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <div className="flex flex-col w-full">
          <div className="my-6">
          <Form {...voyageForm}>
            <form onSubmit={voyageForm.handleSubmit(onSubmit)} className="space-y-8">

              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="default">Create</Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Create New Voyage</SheetTitle>
                  </SheetHeader>

                  <div className="overflow-scroll h-[90%]">

                    <div className="mt-6">
                      <FormField
                        control={voyageForm.control}
                        name="departure"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-left">Departure</FormLabel>
                            <Popover>
                              <FormControl>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-[280px] justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {/* <CalendarIcon className="mr-2 h-4 w-4" /> */}
                                    {field.value ? (
                                      format(field.value, "PPP HH:mm:ss")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>                                
                              </FormControl>
                              <FormMessage />
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                                <div className="p-3 border-t border-border">
                                  <TimePicker
                                    setDate={field.onChange}
                                    date={field.value}
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6">
                      <FormField
                        control={voyageForm.control}
                        name="arrival"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-left">Arrival</FormLabel>
                            <Popover>
                              <FormControl>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-[280px] justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {/* <CalendarIcon className="mr-2 h-4 w-4" /> */}
                                    {field.value ? (
                                      format(field.value, "PPP HH:mm:ss")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                              </FormControl>
                              <FormMessage />
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                                <div className="p-3 border-t border-border">
                                  <TimePicker
                                    setDate={field.onChange}
                                    date={field.value}
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6">
                      <FormField                  
                        control={voyageForm.control}
                        name="portOfLoading"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Port of loading</FormLabel>
                            <FormControl>
                              <Input placeholder="" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6">
                      <FormField
                        control={voyageForm.control}
                        name="portOfDischarge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Port of discharge</FormLabel>
                            <FormControl>
                              <Input placeholder="" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6">
                      <FormField
                        control={voyageForm.control}
                        name="vessel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vessel</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a Vessel" />                              
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="-">Select a Vessel</SelectItem>
                                {vessels?.map((vessel) => (
                                  <SelectItem key={vessel.value} value={vessel.value}>{vessel.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6">
                      <FormField
                        control={voyageForm.control}
                        name="unitTypes"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel className="text-base">Unit Types</FormLabel>
                              <FormDescription>
                                Select at least five Unit Types.
                              </FormDescription>
                            </div>
                            <div className="h-28 overflow-scroll">
                            {unitTypes?.map((unitType) => (
                              <FormField
                                key={unitType.id}
                                control={voyageForm.control}
                                name="unitTypes"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={unitType.id}
                                      className="flex flex-row my-2 items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(unitType.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, unitType.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value: string) => value !== unitType.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {unitType.name}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />  
                    </div>
                  </div>



                  <SheetFooter>
                    {/* <SheetClose asChild> */}
                      <Button type="button" className="mt-6" onClick={voyageForm.handleSubmit(onSubmit)}>Save Voyage</Button>
                    {/* </SheetClose> */}
                  </SheetFooter>
                </SheetContent>
              </Sheet>
             </form>
            </Form>
          </div>
          <div className="">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Departure</TableHead>
                <TableHead>Arrival</TableHead>
                <TableHead>Port of loading</TableHead>
                <TableHead>Port of discharge</TableHead>
                <TableHead>Vessel</TableHead>
                <TableHead>Unit Types</TableHead>
                <TableHead>&nbsp;</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voyages?.map((voyage) => (
                <TableRow key={voyage.id}>
                  <TableCell>
                    {format(
                      new Date(voyage.scheduledDeparture),
                      TABLE_DATE_FORMAT
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(voyage.scheduledArrival), TABLE_DATE_FORMAT)}
                  </TableCell>
                  <TableCell>{voyage.portOfLoading}</TableCell>
                  <TableCell>{voyage.portOfDischarge}</TableCell>
                  <TableCell>{voyage.vessel.name}</TableCell>
                  <TableCell>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" title="Click to see more.">{voyage.unitTypes.length}</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">Unit Types</h4>

                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Default length</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                              {voyage.unitTypes?.map((unitType) => (
                                <TableRow key={unitType.id}>
                                  <TableCell>{unitType.name}</TableCell>
                                  <TableCell align="right">{unitType.defaultLength}</TableCell>
                                </TableRow>
                              ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleDelete(voyage.id)}
                      variant="destructive"
                      title="Delete"
                    >
                      X
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      </Layout>
    </>
  );
}
